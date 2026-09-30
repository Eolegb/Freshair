# Multi-stage : le build a besoin des outils, l'image finale garde seulement
# le serveur autonome produit par `output: "standalone"`.
FROM node:22-slim AS deps
WORKDIR /app
# .npmrc porte `legacy-peer-deps=true`. Indispensable : Clerk exige une version
# de React differente de celle du reste du projet, et sans ce reglage npm refuse
# l'installation avec ERESOLVE. Le fichier ne contient aucun secret.
COPY package.json package-lock.json .npmrc ./
# `npm install` et non `npm ci` : le lockfile de ce depot est incoherent avec
# package.json, `npm ci` echoue net. A corriger un jour, pas pendant un deploiement.
RUN npm install --no-audit --no-fund

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Les variables NEXT_PUBLIC_* sont figees dans le bundle au moment du build :
# elles doivent passer en --build-arg, pas seulement a l'execution.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# 127.0.0.1 et non 0.0.0.0 : le Wi-Fi est mutualise et sans pare-feu. Seul
# Tailscale Funnel doit pouvoir joindre l'appli, pas les voisins du reseau.
ENV HOSTNAME=127.0.0.1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 --gid 1001 nextjs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]