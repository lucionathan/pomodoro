package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/lucionathan/pomodoro/cmd/config/firestore"
	"github.com/lucionathan/pomodoro/cmd/web/session"
	"github.com/lucionathan/pomodoro/cmd/web/websocket"
)

func createUserHandler(w http.ResponseWriter, r *http.Request) {

	ctx, client := firestore.GetClient()

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var requestData struct {
		UserID    string `json:"userID"`
		UserEmail string `json:"userEmail"`
	}

	err := json.NewDecoder(r.Body).Decode(&requestData)

	if err != nil {
		fmt.Println(r.Body)
		fmt.Println("Failed to decode request body")
		http.Error(w, "Failed to decode request body", http.StatusBadRequest)
		return
	}

	userCollection := client.Collection("users")

	_, fireErr := userCollection.Doc(requestData.UserID).Set(ctx, map[string]interface{}{
		"email":    requestData.UserEmail,
		"username": "teste",
	})

	if fireErr != nil {
		log.Printf("An error has occurred: %s", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	return
}

func main() {
	http.HandleFunc("/ws/join", websocket.HandleWebSocketJoin)
	http.HandleFunc("/ws/create", websocket.HandleWebSocketCreate)
	http.HandleFunc("/createUser", createUserHandler)
	http.HandleFunc("/getSessions", session.GetPublicSessions)
	fmt.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
