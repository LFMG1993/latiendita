package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config almacena la configuración de la aplicación cargada desde variables de entorno
type Config struct {
	AppEnv     string
	AppDebug   string
	Port       string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	JWTSecret  string
}

// LoadConfig carga las variables de entorno o establece valores por defecto
func LoadConfig() Config {
	// Intentar cargar el archivo .env si existe en la raíz
	if err := godotenv.Load(); err != nil {
		log.Println("Note: No .env file found or error reading it. Using system environment variables.")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "db"
	}
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "postgres"
	}
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "postgrespassword"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "latiendita"
	}
	dbSSLMode := os.Getenv("DB_SSLMODE")
	if dbSSLMode == "" {
		dbSSLMode = "disable"
	}

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "production"
	}
	appDebug := os.Getenv("APP_DEBUG")
	if appDebug == "" {
		appDebug = "false"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "super-secret-key-change-in-production"
	}

	return Config{
		AppEnv:     appEnv,
		AppDebug:   appDebug,
		Port:       port,
		DBHost:     dbHost,
		DBPort:     dbPort,
		DBUser:     dbUser,
		DBPassword: dbPassword,
		DBName:     dbName,
		DBSSLMode:  dbSSLMode,
		JWTSecret:  jwtSecret,
	}
}
