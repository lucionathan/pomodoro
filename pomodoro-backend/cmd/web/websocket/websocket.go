package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
	"github.com/lucionathan/pomodoro/cmd/web/client"
	"github.com/lucionathan/pomodoro/cmd/web/session"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func HandleWebSocketCreate(w http.ResponseWriter, r *http.Request) {
	conn, err := upgradeConnection(w, r)
	if err != nil {
		log.Println(err)
		return
	}

	publicParam := r.URL.Query().Get("public")
	isPublic, _ := strconv.ParseBool(publicParam)

	sessionID := session.GenerateRandomSessionID()
	sess := session.CreateSession(sessionID, isPublic)
	cl := &client.Client{Conn: conn}
	sess.Clients[cl] = true
	session.SendStartingTimestampAndElapsedTime(sess, cl)
	session.SendMessageToSession(sess, "created", sessionID, cl)

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

	cl := &client.Client{Conn: conn}
	sess.Clients[cl] = true
	session.SendStartingTimestampAndElapsedTime(sess, cl)

	session.ReadAndProcessMessages(conn, sess, cl)
}

func upgradeConnection(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	conn, err := upgrader.Upgrade(w, r, nil)
	return conn, err
}
