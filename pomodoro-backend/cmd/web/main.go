package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	firebase "firebase.google.com/go"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"

	"github.com/lucionathan/pomodoro/cmd/web/session"
	"github.com/lucionathan/pomodoro/cmd/web/websocket"
)

func createUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var requestData struct {
		UserID string `json:"userID"`
	}

	err := json.NewDecoder(r.Body).Decode(&requestData)

	if err != nil {
		fmt.Println(r.Body)
		fmt.Println("Failed to decode request body")
		http.Error(w, "Failed to decode request body", http.StatusBadRequest)
		return
	}

	fmt.Println(requestData.UserID)

	w.WriteHeader(http.StatusOK)
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	privateKey := strings.Replace(os.Getenv("FIRESTORE_PRIVATE_KEY"), "\\n", "\n", -1)

	credentialsJSON := map[string]string{
		"type":                        os.Getenv("FIRESTORE_TYPE"),
		"project_id":                  os.Getenv("FIRESTORE_PROJECT_ID"),
		"private_key_id":              os.Getenv("FIRESTORE_PRIVATE_KEY_ID"),
		"private_key":                 privateKey,
		"client_email":                os.Getenv("FIRESTORE_CLIENT_EMAIL"),
		"client_id":                   os.Getenv("FIRESTORE_CLIENT_ID"),
		"auth_uri":                    os.Getenv("FIRESTORE_AUTH_URI"),
		"token_uri":                   os.Getenv("FIRESTORE_TOKEN_URI"),
		"auth_provider_x509_cert_url": os.Getenv("FIRESTORE_AUTH_PROVIDER_CERT_URL"),
		"client_x509_cert_url":        os.Getenv("FIRESTORE_CLIENT_CERT_URL"),
	}

	credentialsJSONBytes, err := json.Marshal(credentialsJSON)
	if err != nil {
		log.Fatalf("Error marshaling Firestore credentials: %v", err)
	}

	fmt.Println(string(credentialsJSONBytes))

	ctx := context.Background()
	sa := option.WithCredentialsJSON(credentialsJSONBytes)
	app, err := firebase.NewApp(ctx, nil, sa)
	if err != nil {
		log.Fatalln(err)
	}

	client, err := app.Firestore(ctx)
	if err != nil {
		log.Fatalln(err)
	}
	defer client.Close()

	http.HandleFunc("/ws/join", websocket.HandleWebSocketJoin)
	http.HandleFunc("/ws/create", websocket.HandleWebSocketCreate)
	http.HandleFunc("/createUser", createUserHandler)
	http.HandleFunc("/getSessions", session.GetPublicSessions)
	fmt.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
