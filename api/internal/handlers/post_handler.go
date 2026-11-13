package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/JonasFranc1sco/portfolio/internal/models"
	"github.com/JonasFranc1sco/portfolio/internal/services"
	"github.com/gin-gonic/gin"
)

type PostHandler struct {
	postService *services.PostService
}

func NewPostHandler(postService *services.PostService) *PostHandler {
	return &PostHandler{postService: postService}
}

// ListPosts retorna a lista de publicações para a Home (com filtro opcional por topic)
func (h *PostHandler) ListPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	topic := c.Query("topic")

	posts, err := h.postService.ListPosts(c.Request.Context(), topic, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar publicações"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  posts,
		"page":  page,
		"limit": limit,
		"topic": topic,
	})
}

// ListTopics retorna os temas distintos das publicações para montar as abas na Home
func (h *PostHandler) ListTopics(c *gin.Context) {
	topics, err := h.postService.ListTopics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao buscar temas"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"topics": topics,
	})
}

// GetPostBySlug retorna os metadados e o conteúdo .md de um post
func (h *PostHandler) GetPostBySlug(c *gin.Context) {
	slug := c.Param("slug")

	post, err := h.postService.GetPostBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, models.ErrPostNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao carregar publicação"})
		return
	}
	c.JSON(http.StatusOK, post)
}

// CreatePost cria um arquivo .md e registra no banco
func (h *PostHandler) CreatePost(c *gin.Context) {
	userID := c.GetInt64("user_id")

	var input models.CreatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos: Verifique o título e o corpo do post"})
		return
	}

	post, err := h.postService.CreatePost(c.Request.Context(), userID, input)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrPostSlugConflict):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case errors.Is(err, models.ErrInvalidPostInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "erro interno ao salvar publicação"})
		}
		return
	}

	c.JSON(http.StatusCreated, post)
}

// UpdatePost edita o arquivo .md e metadados
func (h *PostHandler) UpdatePost(c *gin.Context) {
	userID := c.GetInt64("user_id")
	slug := c.Param("slug")

	var input models.UpdatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dados inválidos para atualização"})
		return
	}

	post, err := h.postService.UpdatePost(c.Request.Context(), userID, slug, input)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrPostNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, models.ErrForbiddenPostEdit):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao atualizar publicação"})
		}
		return
	}

	c.JSON(http.StatusOK, post)
}

// DeletePost remove o post do banco e o .md do disco
func (h *PostHandler) DeletePost(c *gin.Context) {
	userID := c.GetInt64("user_id")
	slug := c.Param("slug")

	err := h.postService.DeletePost(c.Request.Context(), userID, slug)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrPostNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case errors.Is(err, models.ErrForbiddenPostEdit):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao excluir publicação"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}
