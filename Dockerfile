# --- Stage 1: Build the React Frontend with Latest Bun ---
FROM oven/bun:alpine AS frontend-builder
WORKDIR /app/client

# Copy package manifests and lockfile for caching layers
COPY client/package.json client/bun.lockb* client/bun.lock* ./
RUN bun install --frozen-lockfile

# Copy the rest of the frontend source and build it
COPY client/ ./
RUN bun run build

# --- Stage 2: Build the Go Backend (Go 1.26) ---
FROM golang:1.26-alpine AS backend-builder
WORKDIR /app

# Copy Go dependency manifests
COPY go.mod go.sum ./
RUN go mod download

# Copy the backend source directories
COPY cmd/ ./cmd
COPY internal/ ./internal
COPY db/ ./db
COPY migrations/ ./migrations
COPY Makefile ./Makefile

# Compile the application targeting the nested main file in cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api

# --- Stage 3: Final Production Image ---
FROM alpine:latest
WORKDIR /app

# Copy the compiled Go binary
COPY --from=backend-builder /app/main .

# Copy runtime configuration files (.env)
COPY .env .

# Copy the React static assets from Stage 1 into the production container
COPY --from=frontend-builder /app/client/dist ./client/dist

# Expose your Go backend application port
EXPOSE 8080

# Run the app
CMD ["./main"]
