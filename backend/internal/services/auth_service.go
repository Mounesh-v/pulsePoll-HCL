package services

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"golang.org/x/crypto/bcrypt"

	"pulsepoll/backend/internal/models"
	"pulsepoll/backend/internal/repositories"
)

var (
	ErrEmailExists        = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("invalid email or password")
)

type AuthService struct {
	userRepo  *repositories.UserRepository
	jwtSecret string
}

type AuthResponse struct {
	User  *models.User `json:"user"`
	Token string       `json:"token"`
}

type Claims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}

func NewAuthService(
	repo *repositories.UserRepository,
	secret string,
) *AuthService {
	return &AuthService{
		userRepo:  repo,
		jwtSecret: secret,
	}
}

func (s *AuthService) Register(
	ctx context.Context,
	name string,
	email string,
	password string,
) (*AuthResponse, error) {

	email = strings.ToLower(strings.TrimSpace(email))
	name = strings.TrimSpace(name)

	existingUser, err := s.userRepo.FindByEmail(ctx, email)

	if err == nil && existingUser != nil {
		return nil, ErrEmailExists
	}

	if err != nil && !errors.Is(err, mongo.ErrNoDocuments) {
		return nil, err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		return nil, err
	}

	user := &models.User{
		Name:         name,
		Email:        email,
		PasswordHash: string(hashedPassword),
		CreatedAt:    time.Now(),
	}

	err = s.userRepo.Create(ctx, user)

	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return nil, ErrEmailExists
		}
		return nil, err
	}

	token, err := s.GenerateToken(user)

	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:  user,
		Token: token,
	}, nil
}

func (s *AuthService) Login(
	ctx context.Context,
	email string,
	password string,
) (*AuthResponse, error) {

	user, err := s.userRepo.FindByEmail(ctx, email)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(password),
	)

	if err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := s.GenerateToken(user)

	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:  user,
		Token: token,
	}, nil
}

func (s *AuthService) GenerateToken(
	user *models.User,
) (string, error) {

	claims := Claims{
		Email: user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID.Hex(),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(s.jwtSecret))
}
