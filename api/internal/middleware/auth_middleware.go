package middleware

import (
	"net/http"

	"github.com/JonasFranc1sco/portfolio/internal/handlers"
	"github.com/JonasFranc1sco/portfolio/internal/services"
	"github.com/gin-gonic/gin"
)

// RequireStage garante que o usuário possui um token válido para a rota
func RequireStage(authService *services.AuthService, requiredStage services.AuthStage) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie(handlers.AuthCookieName)
		if err != nil || tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "não autenticado"})
			return
		}

		claims, err := authService.ValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "sessão expirada ou inválida"})
			return
		}

		if claims.Stage != requiredStage {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error":          "etapa de autenticação insuficiente",
				"current_stage":  claims.Stage,
				"required_stage": requiredStage,
			})
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Next()
	}
}
