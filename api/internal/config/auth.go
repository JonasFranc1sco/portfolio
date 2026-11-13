package config

import (
	"net/http"
	"os"

	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"
)

func InitGothOAuth() {
	sessionSecret := os.Getenv("OAUTH_SESSION_SECRET")
	isProd := os.Getenv("GIN_MODE") == "release"

	// Configura o Cookie temporario
	store := sessions.NewCookieStore([]byte(sessionSecret))
	store.MaxAge(300)
	store.Options.Path = "/"
	store.Options.HttpOnly = true
	store.Options.Secure = isProd
	store.Options.SameSite = http.SameSiteLaxMode

	gothic.Store = store

	// Registra os provedores OAuth2
	goth.UseProviders(
		google.New(
			os.Getenv("GOOGLE_CLIENT_ID"),
			os.Getenv("GOOGLE_CLIENT_SECRET"),
			"http://localhost:8080/api/auth/google/callback",
			"email", "profile",
		),
		github.New(
			os.Getenv("GITHUB_CLIENT_ID"),
			os.Getenv("GITHUB_CLIENT_SECRET"),
			"http://localhost:8080/api/auth/github/callback",
			"user:email", "read:user",
		),
	)
}
