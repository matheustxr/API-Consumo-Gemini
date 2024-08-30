FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar todas as dependências (produção e desenvolvimento)
RUN npm install --only=production

# Copiar todo o código da aplicação
COPY . .

# Executar o build do TypeScript
RUN npm run build

# Definir o comando de início da aplicação
CMD ["node", "dist/server.js"]
