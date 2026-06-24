package middlewares

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"runtime/debug"
)

// RecoveryMiddleware atrapa los "panics" (errores fatales) y retorna un error 500 JSON.
func RecoveryMiddleware(appDebug string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					log.Printf("PANIC RECOVERED: %v\n%s", err, debug.Stack())

					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusInternalServerError)

					response := map[string]interface{}{
						"error": "Internal server error",
					}

					if appDebug == "true" {
						response["debug_message"] = fmt.Sprintf("%v", err)
						response["stack_trace"] = string(debug.Stack())
					}

					json.NewEncoder(w).Encode(response)
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}
