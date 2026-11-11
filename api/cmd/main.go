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
	postsStorageDir := "./content/posts"
	isProd := os.Getenv("GIN_MODE") == "release"

	// Injeção de dependências
	// Camada de repositórios
	userRepo := repositories.NewUserRepository(db)
	postRepo := repositories.NewPostRepository(db)

	// Camada de Serviços
	authService := services.NewAuthService(userRepo, jwtSecret, allowedEmails, "JonasFrancisco")
	postService := services.NewPostService(postRepo, postsStorageDir)

	// Camada de Handlers
	authHandler := handlers.NewAuthHandler(authService, frontendURL, isProd)
	postHandler := handlers.NewPostHandler(postService)

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
		posts := api.Group("/posts")
		{
			posts.GET("", postHandler.ListPosts)
			posts.GET("/:slug", postHandler.GetPostBySlug)

			// Rotas protegidas
			protected := posts.Group("")
			protected.Use(middleware.RequireStage(authService, services.StageAuthenticated))
			{
				protected.POST("", postHandler.CreatePost)
				protected.PUT("/:slug", postHandler.UpdatePost)
				protected.DELETE("/:slug", postHandler.DeletePost)
			}
		}
	}

	log.Println("Servidor rodando na porta :8080")
	router.Run(":8080")
}
