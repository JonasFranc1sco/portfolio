package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

var allowedMediaExts = map[string]bool{
	".png":  true,
	".jpg":  true,
	".jpeg": true,
	".webp": true,
	".gif":  true,
	".svg":  true,
	".mp4":  true,
	".webm": true,
}

type UploadHandler struct {
	uploadDir string
}

func NewUploadHandler(uploadDir string) *UploadHandler {
	_ = os.MkdirAll(uploadDir, 0755)
	return &UploadHandler{uploadDir: uploadDir}
}

// UploadMedia recebe uma imagem ou vídeo via multipart/form-data e salva em disco
func (h *UploadHandler) UploadMedia(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "nenhum arquivo enviado"})
		return
	}

	// Limite de 20MB
	if file.Size > 20<<20 {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "arquivo excede o limite de 20MB"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedMediaExts[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "formato não suportado (use png, jpg, webp, gif, svg, mp4 ou webm)"})
		return
	}

	if err := os.MkdirAll(h.uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao preparar diretório de upload"})
		return
	}

	randBytes := make([]byte, 8)
	_, _ = rand.Read(randBytes)
	safeName := fmt.Sprintf("%d-%s%s", time.Now().Unix(), hex.EncodeToString(randBytes), ext)
	destPath := filepath.Join(h.uploadDir, safeName)

	if err := c.SaveUploadedFile(file, destPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao salvar arquivo no disco"})
		return
	}

	publicURL := "/api/uploads/" + safeName
	c.JSON(http.StatusCreated, gin.H{
		"url":      publicURL,
		"filename": safeName,
	})
}
