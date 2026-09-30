#!/usr/bin/env bash
# Deploiement Freshair sur le Minisforum.
# Lance par cron toutes les 3 minutes, ou a la main apres un push.
set -euo pipefail

APP=freshair-app
PORT=3001
# L'appli ecoute sur la boucle locale : c'est Tailscale serve/funnel qui la rend
# joignable (en HTTPS), depuis le tailnet comme depuis l'exterieur. Ecouter sur
# 0.0.0.0 l'aurait exposee aux voisins du Wi-Fi : le reseau est partage, sans
# pare-feu.
BIND=127.0.0.1
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
# `docker inspect .State.Running` ne suffit PAS : un conteneur qui plante en boucle
# repasse par un instant ou il se declare en marche, et le script concluait « tout
# va bien » en laissant la panne en place. La seule preuve est une reponse HTTP.
if [ "$avant" = "$apres" ] && [ -z "${FORCE:-}" ]; then
	code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://$BIND:$PORT/" || true)
	if [ -n "$code" ] && [ "$code" != "000" ]; then
		exit 0
	fi
	log "aucune reponse sur le port $PORT : reconstruction"
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
# -e PORT : sans lui le serveur autonome ecoute sur 3000, deja pris par axiome, et
# le conteneur redemarre en boucle sur EADDRINUSE.
# -e HOSTNAME : l'IP TAILSCALE, pas 0.0.0.0 et pas 127.0.0.1. 0.0.0.0 exposerait
# l'appli aux voisins du Wi-Fi mutualise, qui est sans pare-feu ; 127.0.0.1 la
# rendrait injoignable depuis l'iPhone. L'IP Tailscale est joignable par les
# appareils du tailnet et par personne d'autre.
sg docker -c "docker run -d --name $APP --restart unless-stopped --network host \
	-e PORT=$PORT -e HOSTNAME=$BIND \
	--env-file .env.container $APP:latest" >/dev/null

# Verification par une vraie reponse HTTP, pas par un drapeau d'etat.
for i in $(seq 1 30); do
	code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://$BIND:$PORT/" || true)
	if [ -n "$code" ] && [ "$code" != "000" ]; then
		log "service en ligne sur le port $PORT (reponse $code apres ${i}s)"
		exit 0
	fi
	sleep 1
done

log "ERREUR: aucune reponse sur le port $PORT apres 30s"
sg docker -c "docker logs --tail 20 $APP" 2>&1 | sed 's/^/    /' || true
exit 1