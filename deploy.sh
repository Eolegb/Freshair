#!/usr/bin/env bash
# Deploiement Freshair sur le Minisforum.
# Lance par cron toutes les 3 minutes, ou a la main apres un push.
set -euo pipefail

APP=freshair-app
PORT=3001
cd "$(dirname "$(readlink -f "$0")")"

log() { printf '%s  %s\n' "$(date -Is)" "$*"; }

# Un seul deploiement a la fois. Sans ce verrou, deux passages de cron pendant un
# build lancent deux constructions sur le meme tag et redemarrent le conteneur deux fois.
exec 9>"$PWD/.deploy.lock"
if ! flock -n 9; then
	log "deja en cours, abandon"
	exit 0
fi

avant=$(git rev-parse HEAD)
git fetch --quiet origin main
if ! git merge --ff-only origin/main >/dev/null 2>&1; then
	log "ERREUR: la branche locale a diverge de origin/main — merge manuel requis"
	exit 1
fi
apres=$(git rev-parse HEAD)

# Rien de neuf : ne pas reconstruire. Un build toutes les trois minutes pour rien
# ferait tourner la machine en permanence, et un build consomme 1 a 2 Go.
if [ "$avant" = "$apres" ] && [ -z "${FORCE:-}" ]; then
	if sg docker -c "docker inspect -f '{{.State.Running}}' $APP" 2>/dev/null | grep -q true; then
		exit 0
	fi
	log "conteneur absent ou arrete : reconstruction"
fi

log "code ${apres:0:7}, construction de l'image"

# Les NEXT_PUBLIC_* sont figees dans le bundle au moment du build : elles doivent
# passer en --build-arg. Les valeurs n'ont rien de secret, elles finissent dans le
# JavaScript envoye au navigateur.
set -a
# shellcheck disable=SC1091
. ./.env
set +a

sg docker -c "docker build -t $APP:latest \
	--build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}' \
	--build-arg NEXT_PUBLIC_MAPBOX_TOKEN='${NEXT_PUBLIC_MAPBOX_TOKEN:-}' \
	." || { log "ECHEC de la construction, conteneur precedent laisse en place"; exit 1; }

# Le conteneur n'est remplace qu'apres une construction reussie : jamais de site
# a l'arret parce qu'un build a echoue.
sg docker -c "docker rm -f $APP" >/dev/null 2>&1 || true
sg docker -c "docker run -d --name $APP --restart unless-stopped --network host \
	--env-file .env.container $APP:latest" >/dev/null

sleep 4
if sg docker -c "docker inspect -f '{{.State.Running}}' $APP" 2>/dev/null | grep -q true; then
	log "conteneur en marche sur le port $PORT"
else
	log "ERREUR: le conteneur ne tourne pas — voir 'sg docker -c \"docker logs $APP\"'"
	exit 1
fi