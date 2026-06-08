# ==========================================
# STAGE 1: Build the binary / Compilar el binario
# ==========================================
FROM golang:1.23-alpine AS builder

# Install necessary build tools / Instalar herramientas de compilación necesarias
RUN apk update && apk add --no-cache git ca-certificates

WORKDIR /app

# Copy dependency files first for caching / Copiar archivos de dependencias primero para cachear capas
COPY go.mod ./
RUN go mod download

# Copy the rest of the code / Copiar el resto del código
COPY . .

# Compile optimized binary / Compilar el binario optimizado
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o main .

# ==========================================
# STAGE 2: Run the binary / Ejecutar el binario
# ==========================================
FROM alpine:latest

RUN apk update && apk add --no-cache ca-certificates tzdata

WORKDIR /root/

# Copy compiled binary from builder stage / Copiar binario compilado de la etapa anterior
COPY --from=builder /app/main .

EXPOSE 8080

# Run the app / Ejecutar la aplicación
CMD ["./main"]
