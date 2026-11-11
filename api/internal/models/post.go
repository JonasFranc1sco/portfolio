package models

import (
	"errors"
	"time"
)

// Sentinel errors para o domínio de Posts
var (
	ErrPostNotFound      = errors.New("publicação não encontrada")
	ErrPostSlugConflict  = errors.New("já existe uma publicação com este título/slug")
	ErrInvalidPostInput  = errors.New("título ou conteúdo da publicação inválido")
	ErrForbiddenPostEdit = errors.New("você não tem permissão para alterar essa publicação")
)

// Post representa a publicação da página
type Post struct {
	ID          int64     `json:"id"`
	UserID      int64     `json:"user_id"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Summary     string    `json:"summary"`
	FilePath    string    `json:"-"`
	Content     string    `json:"content,omitempty"`
	ReadingTime int       `json:"reading_time"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CreatePostInput é o DTO para o POST
type CreatePostInput struct {
	Title   string `json:"title" binding:"required,min=3,max=180"`
	Summary string `json:"summary" binding:"max=300"`
	Body    string `json:"body" binding:"required,min=10"`
}

// UpdatePostInput é o DTO para o PUT
type UpdatePostInput struct {
	Title   string `json:"title" binding:"required,min=3,max=180"`
	Summary string `json:"summary" binding:"max=300"`
	Body    string `json:"body" binding:"required,min=10"`
}
