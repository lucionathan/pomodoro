package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/lucionathan/pomodoro/cmd/web/session"
	"github.com/lucionathan/pomodoro/cmd/web/websocket"
)

func main() {
	http.HandleFunc("/ws/join", websocket.HandleWebSocketJoin)
	http.HandleFunc("/ws/create", websocket.HandleWebSocketCreate)
	http.HandleFunc("/getSessions", session.GetPublicSessions)
	fmt.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
