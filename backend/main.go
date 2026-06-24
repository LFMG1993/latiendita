package main

import (
	"backend/core/config"
	"backend/core/database"
	"backend/core/middlewares"
	"backend/handlers"
	"backend/repositories"
	"backend/services"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"
)

func main() {
	cfg := config.LoadConfig()

	db, err := database.ConnectDB(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	shopRepo := repositories.NewShopRepository(db)
	productRepo := repositories.NewProductRepository(db)
	cashSessionRepo := repositories.NewCashSessionRepository(db)
	saleRepo := repositories.NewSaleRepository(db)
	orderRepo := repositories.NewOrderRepository(db)
	paymentMethodRepo := repositories.NewPaymentMethodRepository(db)
	supplierRepo := repositories.NewSupplierRepository(db)
	sessionRepo := repositories.NewSessionRepository(db)

	// Initialize services
	userService := services.NewUserService(userRepo)
	shopService := services.NewShopService(shopRepo)
	productService := services.NewProductService(productRepo)
	cashSessionService := services.NewCashSessionService(cashSessionRepo)
	saleService := services.NewSaleService(saleRepo)
	orderService := services.NewOrderService(orderRepo)
	paymentMethodService := services.NewPaymentMethodService(paymentMethodRepo)
	supplierService := services.NewSupplierService(supplierRepo)
	authService := services.NewAuthService(userRepo, sessionRepo, cfg)

	// Initialize handlers / Inicializar controladores
	userHandler := handlers.NewUserHandler(userService)
	shopHandler := handlers.NewShopHandler(shopService)
	productHandler := handlers.NewProductHandler(productService)
	supplierHandler := handlers.NewSupplierHandler(supplierService)
	paymentMethodHandler := handlers.NewPaymentMethodHandler(paymentMethodService)
	cashSessionHandler := handlers.NewCashSessionHandler(cashSessionService)
	saleHandler := handlers.NewSaleHandler(saleService)
	orderHandler := handlers.NewOrderHandler(orderService)
	authHandler := handlers.NewAuthHandler(authService)

	// Router setup
	// Configuración del enrutador
	mux := http.NewServeMux()

	// Standard health and meta routes
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		response := map[string]string{
			"message": "Welcome to LaTiendita API / Bienvenido a la API de LaTiendita",
			"status":  "healthy",
		}
		json.NewEncoder(w).Encode(response)
	})

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		dbStatus := "healthy"
		if err := db.Ping(); err != nil {
			dbStatus = "unhealthy"
		}

		response := map[string]interface{}{
			"api_status": "healthy",
			"db_status":  dbStatus,
			"timestamp":  time.Now().Format(time.RFC3339),
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
	})

	// User registration and login routes / Rutas para registro y login de usuarios
	mux.HandleFunc("/api/users", userHandler.RegisterUser)
	mux.HandleFunc("/api/register-saas", userHandler.RegisterSaaS)
	mux.HandleFunc("/api/login", authHandler.Login)
	mux.HandleFunc("/api/logout", authHandler.Logout)

	// Protected routes using AuthMiddleware
	authMiddleware := middlewares.AuthMiddleware(authService)
	mux.Handle("/api/me", authMiddleware(http.HandlerFunc(userHandler.GetMe)))

	// Shop routes / Rutas de tiendas
	// POST /api/shops         → Crear tienda
	// GET  /api/shops?owner_id → Listar tiendas del dueño
	mux.HandleFunc("/api/shops", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			shopHandler.CreateShop(w, r)
		case http.MethodGet:
			shopHandler.GetShopsByOwner(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// GET /api/admin/owners -> Listar todos los dueños (SuperAdmin)
	mux.HandleFunc("/api/admin/owners", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			userHandler.GetOwners(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// GET /api/admin/shops -> Listar todas las tiendas (SuperAdmin)
	mux.HandleFunc("/api/admin/shops", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			shopHandler.GetAllShops(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// PUT /api/admin/shops/{id}/approve -> Aprobar tienda pendiente (SuperAdmin)
	mux.HandleFunc("/api/admin/shops/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/approve") && r.Method == http.MethodPut {
			shopHandler.ApproveShop(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Consolidated /api/shops/{id}/... handler
	// All sub-resources are dispatched here based on URL suffix
	mux.HandleFunc("/api/shops/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		// Shop membership
		case strings.HasSuffix(path, "/members"):
			shopHandler.GetShopMembers(w, r)

		// Products
		case strings.Contains(path, "/products/"):
			switch r.Method {
			case http.MethodPut:
				productHandler.UpdateProduct(w, r)
			case http.MethodDelete:
				productHandler.DeleteProduct(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		case strings.HasSuffix(path, "/products"):
			switch r.Method {
			case http.MethodGet:
				productHandler.GetProducts(w, r)
			case http.MethodPost:
				productHandler.CreateProduct(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		// Ingredients
		case strings.Contains(path, "/ingredients/"):
			switch r.Method {
			case http.MethodPut:
				productHandler.UpdateIngredient(w, r)
			case http.MethodDelete:
				productHandler.DeleteIngredient(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		case strings.HasSuffix(path, "/ingredients"):
			switch r.Method {
			case http.MethodGet:
				productHandler.GetIngredients(w, r)
			case http.MethodPost:
				productHandler.CreateIngredient(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		// Suppliers
		case strings.Contains(path, "/suppliers/"):
			switch r.Method {
			case http.MethodPut:
				supplierHandler.UpdateSupplier(w, r)
			case http.MethodDelete:
				supplierHandler.DeleteSupplier(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		case strings.HasSuffix(path, "/suppliers"):
			switch r.Method {
			case http.MethodGet:
				supplierHandler.GetSuppliers(w, r)
			case http.MethodPost:
				supplierHandler.CreateSupplier(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		// Purchases
		case strings.HasSuffix(path, "/purchases"):
			switch r.Method {
			case http.MethodGet:
				supplierHandler.GetPurchases(w, r)
			case http.MethodPost:
				supplierHandler.CreatePurchase(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		// Payment Methods
		case strings.Contains(path, "/payment-methods/"):
			switch r.Method {
			case http.MethodPut:
				paymentMethodHandler.UpdatePaymentMethod(w, r)
			case http.MethodDelete:
				paymentMethodHandler.DeletePaymentMethod(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		case strings.HasSuffix(path, "/payment-methods"):
			switch r.Method {
			case http.MethodGet:
				paymentMethodHandler.GetPaymentMethods(w, r)
			case http.MethodPost:
				paymentMethodHandler.CreatePaymentMethod(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		// Promotions
		case strings.Contains(path, "/promotions/"):
			switch r.Method {
			case http.MethodPut:
				paymentMethodHandler.UpdatePromotion(w, r)
			case http.MethodDelete:
				paymentMethodHandler.DeletePromotion(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		case strings.HasSuffix(path, "/promotions"):
			switch r.Method {
			case http.MethodGet:
				paymentMethodHandler.GetPromotions(w, r)
			case http.MethodPost:
				paymentMethodHandler.CreatePromotion(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		// Cash Sessions
		case strings.HasSuffix(path, "/cash-sessions/open"):
			cashSessionHandler.GetOpenSession(w, r)
		case strings.HasSuffix(path, "/cash-sessions"):
			switch r.Method {
			case http.MethodGet:
				cashSessionHandler.GetCashSessions(w, r)
			case http.MethodPost:
				cashSessionHandler.OpenCashSession(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		// Expenses
		case strings.HasSuffix(path, "/expenses"):
			switch r.Method {
			case http.MethodGet:
				cashSessionHandler.GetExpenses(w, r)
			case http.MethodPost:
				cashSessionHandler.CreateExpense(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		// Sales
		case strings.HasSuffix(path, "/sales"):
			switch r.Method {
			case http.MethodGet:
				saleHandler.GetSales(w, r)
			case http.MethodPost:
				saleHandler.CreateSale(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		// Orders
		case strings.HasSuffix(path, "/orders"):
			switch r.Method {
			case http.MethodGet:
				orderHandler.GetOrders(w, r)
			case http.MethodPost:
				orderHandler.CreateOrder(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		// Debt Payment Requests
		case strings.HasSuffix(path, "/debt-payments"):
			switch r.Method {
			case http.MethodGet:
				orderHandler.GetDebtPaymentRequests(w, r)
			case http.MethodPost:
				orderHandler.CreateDebtPaymentRequest(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		// Client Account: /api/shops/{shop_id}/clients/{client_id}/account
		case strings.HasSuffix(path, "/account"):
			switch r.Method {
			case http.MethodGet:
				orderHandler.GetClientAccount(w, r)
			case http.MethodPut:
				orderHandler.UpdateClientAccount(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}

		// Fallback: GET or PUT shop by ID
		default:
			switch r.Method {
			case http.MethodGet:
				shopHandler.GetShopByID(w, r)
			case http.MethodPut:
				shopHandler.UpdateShop(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		}
	})

	// Top-level routes (not under /api/shops/)
	// GET /api/sales/{id}               → Sale detail with items & payments
	mux.HandleFunc("/api/sales/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			saleHandler.GetSaleDetails(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// PUT /api/orders/{id}/status       → Update order status
	// GET /api/clients/{id}/orders      → Client orders list
	mux.HandleFunc("/api/orders/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/status") && r.Method == http.MethodPut {
			orderHandler.UpdateOrderStatus(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/clients/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/orders") && r.Method == http.MethodGet {
			orderHandler.GetClientOrders(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// PUT /api/debt-payments/{id}/approve → Approve debt payment
	// PUT /api/debt-payments/{id}/reject  → Reject debt payment
	mux.HandleFunc("/api/debt-payments/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		switch {
		case strings.HasSuffix(path, "/approve") && r.Method == http.MethodPut:
			orderHandler.ApproveDebtPayment(w, r)
		case strings.HasSuffix(path, "/reject") && r.Method == http.MethodPut:
			orderHandler.RejectDebtPayment(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// PUT /api/cash-sessions/{id}/close → Close cash session
	mux.HandleFunc("/api/cash-sessions/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/close") && r.Method == http.MethodPut {
			cashSessionHandler.CloseCashSession(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	serverAddr := ":" + cfg.Port
	log.Printf("Server listening on %s / Servidor escuchando en %s", serverAddr, serverAddr)

	// Chain middlewares
	handler := middlewares.CorsMiddleware(mux)
	handler = middlewares.RecoveryMiddleware(cfg.AppDebug)(handler)

	if err := http.ListenAndServe(serverAddr, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
