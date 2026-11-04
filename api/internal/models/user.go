package models

import (
	"errors"
	"time"
)

// Sentinel errors: Erros específicos declarados para facilitar o tratamento de erros no Handler
var (
	ErrUserNotFound      = errors.New("Usuário não encontrado")
	ErrEmailNotAllowed   = errors.New("este e-mail não tem permissão para publicar no blog")
	ErrInvalid2FACode    = errors.New("código de autenticação de dois fatores inválido")
	Err2FAAlreadyEnabled = errors.New("a autenticação de dois fatores já está ativa")
	Err2FANotEnabled     = errors.New("a autenticação de dois fatores ainda não foi configurada")
)

// User representa a entidade de domínio (Domain Entity) salva no banco de dados.
type User struct {
	ID          int64     `json:"id"`
	Email       string    `json:"email"`
	Name        string    `json:"name"`
	AvatarURL   string    `json:"avatar_url"`
	Provider    string    `json:"provider"`
	ProviderID  string    `json:"-"` // Obs: json:"-" impede que os dados desse campo cheguem ao frontend
	Role        string    `json:"role"`
	TOTPSecret  string    `json:"-"`
	TOTPEnabled bool      `json:"totp_enabled"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// OAuthUserInput é o DTO(Data Transfer Object) que desacopla o Service da biblioteca Goth.
type OAuthUserInput struct {
	Email      string
	Name       string
	AvatarURL  string
	Provider   string
	ProviderID string
}

// Setup2FAResponse para exibir o QR Code.
type Setup2FAResponse struct {
	Secret    string `json:"secret"`
	QRCodeURL string `json:"qr_code_url"`
}

// Verify2FAInput é o payload dos 6 digitos do Auth.
type Verify2FAInput struct {
	Code string `json:"code" binding:"required,len-6"`
}
