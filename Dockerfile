
# Dockerfile do frontend (produção)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# ou /app/build para CRA
COPY --from=build /app/dist/frontend-telemetria/browser /usr/share/nginx/html
# COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]



