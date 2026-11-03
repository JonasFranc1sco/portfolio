package models

import "time"

type Post struct {
	CreatedAt time.Time `gorm:"autoCreateTime"`
}
