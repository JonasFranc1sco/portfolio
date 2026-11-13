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
	"github.com/joho/godotenv"
	_ "modernc.org/sqlite"
)

func main() {
	// Inicializa provedores OAuth2 no Goth
	godotenv.Load()
	config.InitGothOAuth()

	// Abre conexão com banco de dados
	db, err := sql.Open("sqlite", "./blog.db")
	if err != nil {
		log.Fatalf("folha ao conectar ao banco: %v", err)
	}
	db.SetMaxOpenConns(1)
	defer db.Close()

	// Garante que a coluna topic exista mesmo em bancos criados antes da migration 003
	_, _ = db.Exec(`ALTER TABLE posts ADD COLUMN topic VARCHAR(100) NOT NULL DEFAULT 'geral';`)
	_, _ = db.Exec(`CREATE INDEX IF NOT EXISTS idx_posts_topic ON posts(topic);`)

	// Carrega variaveis de ambiente
	jwtSecret := os.Getenv("JWT_SECRET")
	allowedEmails := strings.Split(os.Getenv("ALLOWED_AUTHOR_EMAILS"), ",")
	frontendURL := os.Getenv("FRONTEND_URL")
	postsStorageDir := "./content/posts"
	uploadsStorageDir := "./content/uploads"
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
	uploadHandler := handlers.NewUploadHandler(uploadsStorageDir)

	// Configuração de rotas
	router := gin.Default()

	api := router.Group("/api")
	{
		// Serve imagens e vídeos anexados nas publicações
		api.Static("/uploads", uploadsStorageDir)

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

		// Rotas de publicações
		posts := api.Group("/posts")
		{
			posts.GET("", postHandler.ListPosts)
			posts.GET("/topics", postHandler.ListTopics)
			posts.GET("/:slug", postHandler.GetPostBySlug)

			// Rotas protegidas
			protected := posts.Group("")
			protected.Use(middleware.RequireStage(authService, services.StageAuthenticated))
			{
				protected.POST("", postHandler.CreatePost)
				protected.POST("/uploads", uploadHandler.UploadMedia)
				protected.PUT("/:slug", postHandler.UpdatePost)
				protected.DELETE("/:slug", postHandler.DeletePost)
			}
		}
	}

	log.Println("Servidor rodando na porta :8080")
	router.Run(":8080")
}
