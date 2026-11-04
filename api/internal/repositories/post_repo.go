package repositories

import (
	"database/sql"
	"os"

	"github.com/JonasFranc1sco/portfolio/internal/models"
)

type PostRepository struct {
	DB *sql.DB
}

func (r *PostRepository) CreatePost(post *models.Post, content string) error {
	if err := os.WriteFile(post.FilePath, []byte(content), 0644); err != nil {
		return err
	}

	query := `
		INSERT INTO posts (user_id, title, slug, file_path, created_at)
		VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
		RETURNING id, created_at`

	err := r.DB.QueryRow(
		query,
		post.UserID,
		post.Title,
		post.Slug,
		post.FilePath,
	).Scan(&post.ID, &post.CreatedAt)

	return err
}
