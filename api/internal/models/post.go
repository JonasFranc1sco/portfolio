package models

import "time"

type Post struct {
	ID        int64
	UserID    int64
	Title     string
	Slug      string
	FilePath  string
	CreatedAt time.Time
}

type PostInput struct {
	Title string `json:"title" binding:"required"`
	Body  string `json:"body" binding:"required"`
}
