# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.16.0

################################################################################
# Stage Dasar: Instal dependensi dasar.
FROM node:${NODE_VERSION}-alpine as base

WORKDIR /usr/src/app

################################################################################
# Stage Dependensi Produksi: Instal hanya dependensi produksi untuk runtime yang ramping.
FROM base as deps

COPY package.json package-lock.json ./ 
RUN npm ci --omit=dev


################################################################################
# Stage Build: Instal dependensi dev, salin kode sumber, bangun aplikasi.
FROM deps as build

COPY package.json package-lock.json ./ 
RUN npm ci

COPY . .

# Generate klien Prisma: HARUS dijalankan setelah npm ci dan setelah COPY . .
# Ini menghasilkan kode khusus database yang diperlukan oleh @prisma/client.
RUN npx prisma generate

# Jalankan skrip build TypeScript Anda
RUN npm run build


################################################################################
# Stage Final: Image runtime yang bersih dan kecil.
FROM base as final

ENV NODE_ENV production

USER node

COPY package.json .

# Salin node_modules (yang dihasilkan sepenuhnya, termasuk dari prisma generate)
# DARI STAGE BUILD.
COPY --from=build /usr/src/app/node_modules ./node_modules

# Salin aplikasi yang sudah dikompilasi (output TypeScript ke JavaScript)
# dari stage 'build' (asumsikan kompilasi ke folder 'dist').
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 5000

CMD ["npm", "start"]