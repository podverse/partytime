### Build Stage
FROM node:24 AS build
ENV NODE_ENV=development
WORKDIR /app
COPY ["package.json", "package-lock.json", "./"]
RUN npm ci

COPY ["tsconfig.json", "./"]
COPY ["src/", "src/" ]
RUN npm run build


### Test Stage
FROM node:24 AS test
ENV NODE_ENV=test
WORKDIR /app
COPY [".", "./"]
RUN npm ci && npm run test
CMD ["npm", "run", "test"]


### Final
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY ["package.json", "package-lock.json", "./"]
RUN npm ci --omit=dev
COPY --from=build /app/dist /app/dist
CMD ["npm", "start"]
