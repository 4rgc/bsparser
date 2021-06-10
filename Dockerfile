FROM node:12

WORKDIR /app

EXPOSE 8080

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npx", "serve", "-s", "build", "-l", "8080"]