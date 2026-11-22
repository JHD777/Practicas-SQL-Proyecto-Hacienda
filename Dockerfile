FROM node:22-alpine

WORKDIR /app

# Copiamos los archivos del proyecto (sin dependencias npm necesarias)
COPY . .

EXPOSE 8899

ENV HOST=0.0.0.0
ENV PORT=8899

CMD ["node", "server/server.js"]
