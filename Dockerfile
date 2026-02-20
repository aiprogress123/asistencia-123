FROM node:18-alpine

WORKDIR /app

# Copiar package.json específico para Railway
COPY package-railway.json package.json

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads

# Exponer puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Iniciar aplicación
CMD ["node", "server-railway.js"]
