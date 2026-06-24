package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"backend/core/config"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

// ConnectDB inicializa la conexión a la base de datos y ejecuta migraciones
func ConnectDB(cfg config.Config) (*sql.DB, error) {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode)

	log.Printf("Connecting to database at %s:%s...", cfg.DBHost, cfg.DBPort)

	var db *sql.DB
	var err error

	for i := 1; i <= 5; i++ {
		db, err = sql.Open("postgres", connStr)
		if err == nil {
			err = db.Ping()
		}
		if err == nil {
			break
		}
		log.Printf("[Attempt %d/5] Database not ready yet, retrying in 2 seconds...", i)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		return nil, fmt.Errorf("could not connect to the database: %w", err)
	}

	log.Println("Successfully connected to the database / Conexión exitosa a la base de datos")

	RunMigrations(db)

	return db, nil
}

// RunMigrations ejecuta las migraciones de base de datos
func RunMigrations(db *sql.DB) {
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		log.Fatalf("Could not create migration driver / No se pudo crear el driver de migración: %v", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://migrations",
		"postgres", driver)
	if err != nil {
		log.Fatalf("Could not create migrate instance / No se pudo crear la instancia de migración: %v", err)
	}

	log.Println("Running database migrations... / Ejecutando migraciones de base de datos...")
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Could not run up migrations / No se pudieron ejecutar las migraciones: %v", err)
	}
	log.Println("Migrations applied successfully / Migraciones aplicadas con éxito")
}
