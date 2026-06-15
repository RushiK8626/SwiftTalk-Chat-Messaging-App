FROM node:20-alpine AS build

ARG VITE_APP_API_URL
ARG VITE_APP_SOCKET_URL
ENV VITE_APP_API_URL=$VITE_APP_API_URL
ENV VITE_APP_SOCKET_URL=$VITE_APP_SOCKET_URL

WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .   
RUN npm run build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]