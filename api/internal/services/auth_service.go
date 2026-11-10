package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/JonasFranc1sco/portfolio/internal/models"
	"github.com/JonasFranc1sco/portfolio/internal/repositories"
	"github.com/golang-jwt/jwt/v5"
	"github.com/pquerna/otp/totp"
)

type AuthStage string

const (
	StagePending2FA    AuthStage = "pending_s2fa"
	StageAuthenticated AuthStage = "authenticated"
)

// AuthClaims representa o payload dentro do JWT
type AuthClaims struct {
	UserID int64     `json:"user_id"`
	Email  string    `json:"email"`
	Stage  AuthStage `json:"stage"`
	jwt.RegisteredClaims
}

type AuthService struct {
	userRepo      repositories.UserRepositoryInterface
	jwtSecret     []byte
	allowedEmails map[string]bool
	issuerName    string
}

func NewAuthService(userRepo repositories.UserRepositoryInterface, jwtSecret string, allowedEmails []string, issuerName string) *AuthService {
	whitelist := make(map[string]bool, len(allowedEmails))
	for _, email := range allowedEmails {
		clean := strings.TrimSpace(strings.ToLower(email))
		if clean != "" {
			whitelist[clean] = true
		}
	}

	return &AuthService{
		userRepo:      userRepo,
		jwtSecret:     []byte(jwtSecret),
		allowedEmails: whitelist,
		issuerName:    issuerName,
	}
}

// HandleOAuthLogin processa o retorno do Provider, valida o usuário e gera um token para a etapa 2FA
func (s *AuthService) HandleOAuthLogin(ctx context.Context, input models.OAuthUserInput) (*models.User, string, error) {
	normalizedEmail := strings.TrimSpace(strings.ToLower(input.Email))

	// Verifique no whitelist se o e-mail é autorizado
	if !s.allowedEmails[normalizedEmail] {
		return nil, "", models.ErrEmailNotAllowed
	}

	input.Email = normalizedEmail

	// Salva ou atualiza o usuário no banco de dados
	user, err := s.userRepo.UpsertOAuthUser(ctx, input)
	if err != nil {
		return nil, "", fmt.Errorf("erro ao salvar usuário OAuth: %w", err)
	}

	// Emite o Token temporário para etapa de 2FA
	preAuthToken, err := s.generateToken(user, StagePending2FA, 5*time.Minute)
	if err != nil {
		return nil, "", fmt.Errorf("ero ao gerar token pré-2fa: %w", err)
	}

	return user, preAuthToken, nil
}

// Initiate2FASetup gera uma chave TOTP para o usuário que não tem 2FA ativo
func (s *AuthService) Initiate2FASetup(ctx context.Context, userID int64) (*models.Setup2FAResponse, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if user.TOTPEnabled {
		return nil, models.Err2FAAlreadyEnabled
	}

	// Gera a secret key seguindo RFC 6238
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      s.issuerName,
		AccountName: user.Email,
	})
	if err != nil {
		return nil, fmt.Errorf("erro ao gerar chave TOTP: %w", err)
	}

	// Salvar secret no banco
	if err := s.userRepo.SaveTOTPSecret(ctx, user.ID, key.Secret()); err != nil {
		return nil, fmt.Errorf("erro ao salvar segredo TOTP: %w", err)
	}

	return &models.Setup2FAResponse{
		Secret:    key.Secret(),
		QRCodeURL: key.URL(),
	}, nil
}

// VerifyAndComplete2FA valida o código de 6 dígitos do Authenticator.
func (s *AuthService) VerifyAndComplete2FA(ctx context.Context, userID int64, code string) (string, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return "", err
	}

	if user.TOTPSecret == "" {
		return "", models.ErrEmailNotAllowed
	}

	valid := totp.Validate(code, user.TOTPSecret)
	if !valid {
		return "", models.ErrInvalid2FACode
	}

	if !user.TOTPEnabled {
		if err := s.userRepo.EnableTOTP(ctx, user.ID); err != nil {
			return "", fmt.Errorf("erro ao ativar 2FA do usuário: %w", err)
		}
	}

	fullToken, err := s.generateToken(user, StageAuthenticated, 24*time.Hour)
	if err != nil {
		return "", fmt.Errorf("erro ao gerar token final: %w", err)
	}

	return fullToken, nil
}

// ValidateToken faz o parse e valida a assinatura e expiração JWT
func (s *AuthService) ValidateToken(tokenString string) (*AuthClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AuthClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de assinatura inesperado: %v", t.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*AuthClaims)
	if !ok || !token.Valid {
		return nil, errors.New("token inválido")
	}
	return claims, nil
}

func (s *AuthService) generateToken(user *models.User, stage AuthStage, duration time.Duration) (string, error) {
	now := time.Now()
	claims := AuthClaims{
		UserID: user.ID,
		Email:  user.Email,
		Stage:  stage,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", user.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(duration)),
			Issuer:    s.issuerName,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}
