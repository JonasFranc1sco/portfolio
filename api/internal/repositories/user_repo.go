package repositories

import (
	"context"
	"database/sql"
	"errors"

	"github.com/JonasFranc1sco/portfolio/internal/models"
)

// UserRepositoryInterface define o contrato de persistência para usuários.
type UserRepositoryInterface interface {
	UpsertOAuthUser(ctx context.Context, input models.OAuthUserInput) (*models.User, error)
	GetByID(ctx context.Context, id int64) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	SaveTOTPSecret(ctx context.Context, userID int64, secret string) error
	EnableTOTP(ctx context.Context, userID int64) error
}

type UserRepository struct {
	DB *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{DB: db}
}

// UpsertOAuthUser cria o usuário no primeiro login social ou atualiza seu nome/avatar nos próximos logins.
func (r *UserRepository) UpsertOAuthUser(ctx context.Context, input models.OAuthUserInput) (*models.User, error) {
	query := `
		INSERT INTO users(email, name, avatar_url, provider, provider_id, updated_at)
		VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
		ON CONFLICT(email) DO UPDATE SET
			name = excluded.name,
			avatar_url = excluded.avatar_url,
			provider = excluded.provider,
			provider_id = excluded.provider_id,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, email, name, avatar_url, provider, provider_id, role,
	COALESCE(totp_secret, ''), totp_enabled, created_at, updated_at
	`

	var user models.User
	err := r.DB.QueryRowContext(
		ctx,
		query,
		input.Email,
		input.Name,
		input.AvatarURL,
		input.Provider,
		input.ProviderID,
	).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.AvatarURL,
		&user.Provider,
		&user.ProviderID,
		&user.Role,
		&user.TOTPSecret,
		&user.TOTPEnabled,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id int64) (*models.User, error) {
	query := `
		SELECT id, email, name, avatar_url, provider, provider_id, role,
	COALESCE(totp_secret, ''), totp_enabled, created_at, updated_at
		FROM users
		WHERE id = ?
	`

	var user models.User
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.AvatarURL,
		&user.Provider,
		&user.ProviderID,
		&user.Role,
		&user.TOTPSecret,
		&user.TOTPEnabled,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, models.ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, email, name, avatar_url, provider, provider_id, role,
	COALESCE(totp_secret, ''), totp_enabled, created_at, updated_at
		FROM users
		WHERE email = ?
	`

	var user models.User
	err := r.DB.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Name,
		&user.AvatarURL,
		&user.Provider,
		&user.ProviderID,
		&user.Role,
		&user.TOTPSecret,
		&user.TOTPEnabled,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, models.ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

// SaveTOTPSecret guarda o secret gerado
func (r *UserRepository) SaveTOTPSecret(ctx context.Context, userID int64, secret string) error {
	query := `
		UPDATE users SET totp_secret = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
	`
	_, err := r.DB.ExecContext(ctx, query, secret, userID)
	return err
}

// EnableTOTP faz a validação do código e ativa o 2FA
func (r *UserRepository) EnableTOTP(ctx context.Context, userID int64) error {
	query := `UPDATE users SET totp_enabled = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := r.DB.ExecContext(ctx, query, userID)
	return err
}
