package firestore

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"strings"

	firebase "firebase.google.com/go"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"

	"cloud.google.com/go/firestore"
)

func getCredentials() []byte {
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

	return credentialsJSONBytes
}

func GetClient() *firestore.Client {

	ctx := context.Background()
	credentials := getCredentials()
	sa := option.WithCredentialsJSON(credentials)
	app, err := firebase.NewApp(ctx, nil, sa)
	if err != nil {
		log.Fatalln(err)
	}

	client, err := app.Firestore(ctx)
	if err != nil {
		log.Fatalln(err)
	}

	return client
}
