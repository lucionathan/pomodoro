package websocket

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
	"github.com/lucionathan/pomodoro/cmd/config/firestore"
	"github.com/lucionathan/pomodoro/cmd/web/client"
	"github.com/lucionathan/pomodoro/cmd/web/session"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func GetUserUsername(uid string) (string, error) {
	ctx, client := firestore.GetClient()

	userRef := client.Collection("users").Doc(uid)

	userSnapshot, err := userRef.Get(ctx)
	if err != nil {
		log.Printf("Failed to retrieve user document: %v", err)
		return "", err
	}

	username, err := userSnapshot.DataAt("username")
	if err != nil {
		log.Printf("Failed to retrieve username from user document: %v", err)
		return "", err
	}

	usernameStr, ok := username.(string)
	if !ok {
		log.Printf("Username is not a string")
		return "", nil
	}

	return usernameStr, nil
}

func HandleWebSocketCreate(w http.ResponseWriter, r *http.Request) {
	conn, err := upgradeConnection(w, r)
	if err != nil {
		log.Println(err)
		return
	}

	publicParam := r.URL.Query().Get("public")
	isPublic, _ := strconv.ParseBool(publicParam)
	userIdParam := r.URL.Query().Get("userId")
	username, _ := GetUserUsername(userIdParam)
	fmt.Println(username)

	fmt.Println("ID:", userIdParam)

	sessionID := session.GenerateRandomSessionID()
	sess := session.CreateSession(sessionID, isPublic)
	cl := &client.Client{Conn: conn, Username: username}
	sess.Clients[cl] = true
	session.SendStartingTimestampAndElapsedTime(sess, cl)
	session.SendMessageToSession(sess, "created", sessionID, cl, "")
	session.SendMessageToSession(sess, "userJoined", username, nil, "")

	session.ReadAndProcessMessages(conn, sess, cl)
}

func HandleWebSocketJoin(w http.ResponseWriter, r *http.Request) {
	conn, err := upgradeConnection(w, r)
	if err != nil {
		log.Println(err)
		return
	}

	sessionID := r.URL.Query().Get("session")
	sess, err := session.GetSession(sessionID)
	if err != nil {
		message := session.Message{
			Action: "error",
			Data:   "Session not found",
		}
		messageBytes, _ := json.Marshal(message)
		conn.WriteMessage(websocket.TextMessage, messageBytes)

		conn.Close()
		return
	}

	userIdParam := r.URL.Query().Get("userId")
	username, _ := GetUserUsername(userIdParam)

	cl := &client.Client{Conn: conn, Username: username}
	sess.Clients[cl] = true
	session.SendStartingTimestampAndElapsedTime(sess, cl)

	session.SendMessageToSession(sess, "userJoined", username, nil, "")

	session.ReadAndProcessMessages(conn, sess, cl)
}

func upgradeConnection(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	conn, err := upgrader.Upgrade(w, r, nil)
	return conn, err
}
