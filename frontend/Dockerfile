# Frontend Static Build  
# Build the React app and serve with nginx

FROM node:20-alpine as builder

WORKDIR /app

# Build arguments
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GOOGLE_CLIENT_ID

# Set as environment variables for build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Copy package files
COPY frontend/package*.json ./

# Install dependencies (--legacy-peer-deps for React 19 compatibility with react-joyride)
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY frontend/ .
RUN npm run build

# Production nginx stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
