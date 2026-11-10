package main

import (
	"database/sql"
	"log"
	"os"
	"strings"

	"github.com/JonasFranc1sco/portfolio/internal/config"
	"github.com/JonasFranc1sco/portfolio/internal/handlers"
	"github.com/JonasFranc1sco/portfolio/internal/middleware"
	"github.com/JonasFranc1sco/portfolio/internal/repositories"
	"github.com/JonasFranc1sco/portfolio/internal/services"
	"github.com/gin-gonic/gin"
)

func main() {
	// Inicializa provedores OAuth2 no Goth
	config.InitGothOAuth()

	// Abre conexão com banco de dados
	db, err := sql.Open("sqlite", "./blog.db")
	if err != nil {
		log.Fatalf("folha ao conectar ao banco: %v", err)
	}
	defer db.Close()

	// Carrega variaveis de ambiente
	jwtSecret := os.Getenv("JWT_SECRET")
	allowedEmails := strings.Split(os.Getenv("ALLOWED_AUTHOR_EMAILS"), ",")
	frontendURL := os.Getenv("FRONTEND_URL")
	isProd := os.Getenv("GIN_MODE") == "release"

	// Injeção de dependências
	userRepo := repositories.NewUserRepository(db)
	authService := services.NewAuthService(userRepo, jwtSecret, allowedEmails, "JonasFrancisco")
	authHandler := handlers.NewAuthHandler(authService, frontendURL, isProd)

	// Configuração de rotas
	router := gin.Default()

	api := router.Group("/api")
	{
		// Rotas públicas de OAuth2
		auth := api.Group("/auth")
		{
			auth.GET("/:provider", authHandler.BeginOAuth)
			auth.GET("/:provider/callback", authHandler.OAuthCallBack)
			auth.POST("/logout", authHandler.Logout)

			// Rotas intermediárias
			twoFA := auth.Group("/2fa")
			twoFA.Use(middleware.RequireStage(authService, services.StagePending2FA))
			{
				twoFA.POST("/setup", authHandler.Setup2FA)
				twoFA.POST("/verify", authHandler.Verify2FA)
			}
		}

		// Rotas protegidas
		author := api.Group("/posts")
		author.Use(middleware.RequireStage(authService, services.StageAuthenticated))
		{
			// Rotas de posts
		}
	}

	log.Println("Servidor rodando na porta :8080")
	router.Run(":8080")
}
