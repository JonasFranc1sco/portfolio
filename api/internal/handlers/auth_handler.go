package handlers

import (
	"errors"
	"net/http"

	"github.com/JonasFranc1sco/portfolio/internal/models"
	"github.com/JonasFranc1sco/portfolio/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

const AuthCookieName = "portfolio_auth_token"

type AuthHandler struct {
	authService *services.AuthService
	frontendURL string
	isProd      bool
}

func NewAuthHandler(authService *services.AuthService, frontendURL string, isProd bool) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		frontendURL: frontendURL,
		isProd:      isProd,
	}
}

// BeginOAuth inicia o redirecionamento para o provedor
func (h *AuthHandler) BeginOAuth(c *gin.Context) {
	provider := c.Param("provider")

	// Injeta o provider na Query da requisição
	q := c.Request.URL.Query()
	q.Add("provider", provider)
	c.Request.URL.RawQuery = q.Encode()

	gothic.BeginAuthHandler(c.Writer, c.Request)
}
func (h *AuthHandler) OAuthCallBack(c *gin.Context) {
	provider := c.Param("provider")
	q := c.Request.URL.Query()
	q.Add("provider", provider)
	c.Request.URL.RawQuery = q.Encode()

	gothUser, err := gothic.CompleteUserAuth(c.Writer, c.Request)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "falha ao autenticar com o provedor OAuth2"})
		return
	}

	user, preAuthToken, err := h.authService.HandleOAuthLogin(c.Request.Context(), models.OAuthUserInput{
		Email:      gothUser.Email,
		Name:       gothUser.Name,
		AvatarURL:  gothUser.AvatarURL,
		Provider:   gothUser.Provider,
		ProviderID: gothUser.UserID,
	})
	if err != nil {
		if errors.Is(err, models.ErrEmailNotAllowed) {
			c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/login?error=unauthorized_author")
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro interno ao processar login"})
		return
	}

	// Salva token temporário em um Cookie HttpOnly
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(AuthCookieName, preAuthToken, 300, "/", "", h.isProd, true)

	if user.TOTPEnabled {
		c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/login/2fa-verify")
		return
	}
	c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/login/2fa-setup")
}

// Setup2FA gera o secret e a URL do QR Code
func (h *AuthHandler) Setup2FA(c *gin.Context) {
	userID := c.GetInt64("user_id")

	resp, err := h.authService.Initiate2FASetup(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, models.Err2FAAlreadyEnabled) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao gerar configuração de 2FA"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Verify2FA recebe o código de 6 digitos e promove o cookie para sessão
func (h *AuthHandler) Verify2FA(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var input models.Verify2FAInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "envie um código válido de 6 dígitos"})
		return
	}

	fullToken, err := h.authService.VerifyAndComplete2FA(c.Request.Context(), userID, input.Code)
	if err != nil {
		if errors.Is(err, models.ErrInvalid2FACode) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Substitui cookie temporário pelo cookie definitivo
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(AuthCookieName, fullToken, 86400, "/", "", h.isProd, true)

	c.JSON(http.StatusOK, gin.H{"message": "autenticação de dois fatores concluída com sucesso"})
}

// Logout limpa cookie da sessão
func (h *AuthHandler) Logout(c *gin.Context) {
	c.SetCookie(AuthCookieName, "", -1, "/", "", h.isProd, true)
	c.JSON(http.StatusOK, gin.H{"message": "logout realizado"})
}
