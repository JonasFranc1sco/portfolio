package services

import (
	"context"
	"math"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/JonasFranc1sco/portfolio/internal/models"
	"github.com/JonasFranc1sco/portfolio/internal/repositories"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

var nonAlphanumericRegex = regexp.MustCompile(`[^a-z0-9]+`)

type PostService struct {
	postRepo   repositories.PostRepositoryInterface
	storageDir string
}

func NewPostService(postRepo repositories.PostRepositoryInterface, storageDir string) *PostService {
	return &PostService{
		postRepo:   postRepo,
		storageDir: storageDir,
	}
}

// CreatePost coordena a criação do post com regras de negócio
func (s *PostService) CreatePost(ctx context.Context, userID int64, input models.CreatePostInput) (*models.Post, error) {
	slug := generateSlug(input.Title)
	if slug == "" {
		return nil, models.ErrInvalidPostInput
	}

	summary := strings.TrimSpace(input.Summary)
	if summary == "" {
		summary = generateExcerpt(input.Body, 160)
	}

	// Filepath.Base garante que não haverá "../" no nome do arquivo
	safeFileName := filepath.Base(slug) + ".md"
	fullPath := filepath.Join(s.storageDir, safeFileName)

	post := &models.Post{
		UserID:      userID,
		Title:       strings.TrimSpace(input.Title),
		Slug:        slug,
		Summary:     summary,
		FilePath:    fullPath,
		ReadingTime: calculateReadingTime(input.Body),
	}

	if err := s.postRepo.CreatePost(ctx, post, input.Body); err != nil {
		return nil, err
	}

	post.Content = input.Body
	return post, nil
}

// ListPosts retorna os posts com paginação segura
func (s *PostService) ListPosts(ctx context.Context, page, pageSize int) ([]models.Post, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize
	return s.postRepo.GetAllPosts(ctx, pageSize, offset)
}

// GetPostBySlug busca um post específico
func (s *PostService) GetPostBySlug(ctx context.Context, slug string) (*models.Post, error) {
	cleanSlug := generateSlug(slug)
	if cleanSlug == "" {
		return nil, models.ErrPostNotFound
	}
	return s.postRepo.GetPostBySlug(ctx, cleanSlug)
}

// UpdatePost atualiza post existente se o usuário é dono do post
func (s *PostService) UpdatePost(ctx context.Context, userID int64, slug string, input models.UpdatePostInput) (*models.Post, error) {
	existingPost, err := s.postRepo.GetPostBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	// Verifica se quem está tentando editar é o autor do post
	if existingPost.UserID != userID {
		return nil, models.ErrForbiddenPostEdit
	}

	summary := strings.TrimSpace(input.Summary)
	if summary == "" {
		summary = generateExcerpt(input.Body, 160)
	}

	existingPost.Title = strings.TrimSpace(input.Title)
	existingPost.Summary = summary
	existingPost.ReadingTime = calculateReadingTime(input.Body)

	if err := s.postRepo.UpdatePost(ctx, existingPost, input.Body); err != nil {
		return nil, err
	}

	existingPost.Content = input.Body
	return existingPost, nil
}

// DeletePost remove um post após avaliar usuário autenticado
func (s *PostService) DeletePost(ctx context.Context, userID int64, slug string) error {
	existingPost, err := s.postRepo.GetPostBySlug(ctx, slug)
	if err != nil {
		return err
	}

	if existingPost.UserID != userID {
		return models.ErrForbiddenPostEdit
	}
	return s.postRepo.DeletePost(ctx, existingPost.Slug)
}

// Funções Auxiliares

// generateSlug remove acentos e substitui espaços por hífens
func generateSlug(title string) string {
	t := transform.Chain(norm.NFC)
	normalized, _, err := transform.String(t, strings.ToLower(title))
	if err != nil {
		normalized = strings.ToLower(title)
	}

	slug := nonAlphanumericRegex.ReplaceAllString(normalized, "-")
	return strings.Trim(slug, "-")
}

// calculateReadingTime estima os minutos de leitura com base na quantidade de palavras/min
func calculateReadingTime(markdown string) int {
	words := strings.Fields(markdown)
	minutes := int(math.Ceil(float64(len(words)) / 200.0))
	if minutes < 1 {
		return 1
	}
	return minutes
}

// generateExcerpt cria um resumo limpo
func generateExcerpt(markdown string, maxLen int) string {
	clean := strings.ReplaceAll(markdown, "#", "")
	clean = strings.ReplaceAll(clean, "*", "")
	clean = strings.ReplaceAll(clean, "`", "")
	clean = strings.Join(strings.Fields(clean), " ")

	runesSlice := []rune(clean)
	if len(runesSlice) <= maxLen {
		return clean
	}

	return string(runesSlice[:maxLen]) + "..."
}
