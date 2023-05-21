package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/lucionathan/pomodoro/cmd/config/firestore"
	"github.com/lucionathan/pomodoro/cmd/web/session"
	"github.com/lucionathan/pomodoro/cmd/web/websocket"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

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
	r := mux.NewRouter()

	r.Handle("/ws/join", corsMiddleware(http.HandlerFunc(websocket.HandleWebSocketJoin)))
	r.Handle("/ws/create", corsMiddleware(http.HandlerFunc(websocket.HandleWebSocketCreate)))
	r.Handle("/createUser", corsMiddleware(http.HandlerFunc(createUserHandler)))
	r.Handle("/getSessions", corsMiddleware(http.HandlerFunc(session.GetPublicSessions)))
	r.Handle("/usernames/{sessionID}", corsMiddleware(http.HandlerFunc(session.GetUsernamesInSession)))
	r.Handle("/session/{sessionID}", corsMiddleware(http.HandlerFunc(session.GetClientsInSession)))

	fmt.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
