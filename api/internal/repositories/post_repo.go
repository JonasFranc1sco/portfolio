package repositories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/JonasFranc1sco/portfolio/internal/models"
)

// PostRepositoryInterface define contrato que o PostService utilizará
type PostRepositoryInterface interface {
	CreatePost(ctx context.Context, post *models.Post, content string) error
	GetAllPosts(ctx context.Context, limit, offset int) ([]models.Post, error)
	GetPostBySlug(ctx context.Context, slug string) (*models.Post, error)
	UpdatePost(ctx context.Context, post *models.Post, content string) error
	DeletePost(ctx context.Context, slug string) error
}

type PostRepository struct {
	DB *sql.DB
}

func NewPostRepository(db *sql.DB) *PostRepository {
	return &PostRepository{DB: db}
}

// CreatePost grava o arquivo .md no disco e salva metadados no banco
func (r *PostRepository) CreatePost(ctx context.Context, post *models.Post, content string) error {
	dir := filepath.Dir(post.FilePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("erro ao criar diretório de posts: %w", err)
	}

	// Cria arquivo usando O_EXCL para evitar sobrescrição de .md
	file, err := os.OpenFile(post.FilePath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0644)
	if err != nil {
		if errors.Is(err, os.ErrExist) {
			return models.ErrPostSlugConflict
		}
		return fmt.Errorf("erro ao criar arquivo markdown: %w", err)
	}

	_, writeErr := file.WriteString(content)
	closeErr := file.Close()
	if writeErr != nil || closeErr != nil {
		_ = os.Remove(post.FilePath)
		return fmt.Errorf("erro ao escrever conteúdo no arquivo markdown: %w", writeErr)
	}

	// Insere metadados no banco de dados
	query := `
		INSERT INTO posts (user_id, title, slug, summary, file_path, reading_time, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id, created_at, updated_at`

	err = r.DB.QueryRowContext(
		ctx,
		query,
		post.UserID,
		post.Title,
		post.Slug,
		post.Summary,
		post.FilePath,
		post.ReadingTime,
	).Scan(&post.ID, &post.CreatedAt, &post.UpdatedAt)

	// RollBack caso aconteça erro no banco
	if err != nil {
		_ = os.Remove(post.FilePath)
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			return models.ErrPostSlugConflict
		}
		return fmt.Errorf("erro ao inserir post no banco: %w", err)
	}
	return nil
}

// GetAllPosts retorna a lista de posts com metadados do banco.
func (r *PostRepository) GetAllPosts(ctx context.Context, limit, offset int) ([]models.Post, error) {
	query := `
		SELECT id, user_id, title, slug, summary, reading_time, created_at, updated_at
		FROM posts
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := r.DB.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar posts: %w", err)
	}

	defer rows.Close()

	posts := []models.Post{}
	for rows.Next() {
		var p models.Post
		if err := rows.Scan(
			&p.ID,
			&p.UserID,
			&p.Title,
			&p.Slug,
			&p.Summary,
			&p.ReadingTime,
			&p.CreatedAt,
			&p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("erro ao escanear linha de post: %w", err)
		}
		posts = append(posts, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

// GetPostBySlug busca metadados no banco e lê o conteúdo do .md correspondente
func (r *PostRepository) GetPostBySlug(ctx context.Context, slug string) (*models.Post, error) {
	query := `
		SELECT id, user_id, title, slug, summary, file_path, reading_time, created_at, updated_at
		FROM posts
		WHERE slug = ?
	`

	var post models.Post
	err := r.DB.QueryRowContext(ctx, query, slug).Scan(
		&post.ID,
		&post.UserID,
		&post.Title,
		&post.Slug,
		&post.Summary,
		&post.FilePath,
		&post.ReadingTime,
		&post.CreatedAt,
		&post.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, models.ErrPostNotFound
		}
		return nil, fmt.Errorf("erro ao buscar post por slug: %w", err)
	}

	// Lê arquivos .md no disco
	rawBytes, err := os.ReadFile(post.FilePath)
	if err != nil {
		return nil, fmt.Errorf("erro ao ler arquivo markdown (%s): %w", post.FilePath, err)
	}

	post.Content = string(rawBytes)
	return &post, nil
}

// UpdatePost atualiza o conteúdo no .md do disco e nos metadados do banco
func (r *PostRepository) UpdatePost(ctx context.Context, post *models.Post, content string) error {
	// Atualiza .md no disco
	if err := os.WriteFile(post.FilePath, []byte(content), 0644); err != nil {
		return fmt.Errorf("erro ao atualizar arquivo markdown: %w", err)
	}

	// Atualiza metadados no banco
	query := `
		UPDATE posts
		SET title = ?, summary = ?, reading_time = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
		RETURNING updated_at
	`

	err := r.DB.QueryRowContext(
		ctx,
		query,
		post.Title,
		post.Summary,
		post.ReadingTime,
		post.ID,
	).Scan(&post.UpdatedAt)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.ErrPostNotFound
		}
		return fmt.Errorf("erro ao atualizar metadados do post: %w", err)
	}

	return nil
}

// DeletePost remove o registro do banco e o arquivo .md correspondente do disco
func (r *PostRepository) DeletePost(ctx context.Context, slug string) error {
	// Busca do file_path no disco
	var filePath string
	querySelect := `SELECT file_path FROM posts WHERE slug = ?`
	err := r.DB.QueryRowContext(ctx, querySelect, slug).Scan(&filePath)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.ErrPostNotFound
		}
		return err
	}

	// Remove do banco de dados
	queryDelete := `DELETE FROM posts WHERE slug = ?`
	_, err = r.DB.ExecContext(ctx, queryDelete, slug)
	if err != nil {
		return fmt.Errorf("erro ao deletar post do banco: %w", err)
	}

	// Remove o arquivo .md do disco
	if err := os.Remove(filePath); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("post removido do banco, mas falhou ao remover arquivo físico: %w", err)
	}

	return nil
}
