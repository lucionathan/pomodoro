package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/lucionathan/pomodoro/cmd/web/ws"

	"github.com/gorilla/websocket"
	"github.com/lucionathan/pomodoro/cmd/web/session"
)

func handleWebSocketCreate(w http.ResponseWriter, r *http.Request) {
	conn, err := ws.UpgradeConnection(w, r)
	if err != nil {
		log.Println(err)
		return
	}

	sessionID := session.GenerateRandomSessionID()
	sess := session.GetSession(sessionID)
	client := &session.Client{Conn: conn}
	sess.Clients[client] = true
	sendStartingTimestampAndElapsedTime(sess, client)
	sendToSession(sess, "created", sessionID, client)

	readAndProcessMessages(conn, sess, client)
}

func handleWebSocketJoin(w http.ResponseWriter, r *http.Request) {
	conn, err := ws.UpgradeConnection(w, r)
	if err != nil {
		log.Println(err)
		return
	}

	client, sess := createClientAndSession(r, conn)
	sess.Clients[client] = true
	sendStartingTimestampAndElapsedTime(sess, client)

	readAndProcessMessages(conn, sess, client)
}

func createClientAndSession(r *http.Request, conn *websocket.Conn) (*session.Client, *session.Session) {
	client := &session.Client{Conn: conn}
	sessionID := r.URL.Query().Get("session")
	sess := session.GetSession(sessionID)
	return client, sess
}

func sendStartingTimestampAndElapsedTime(sess *session.Session, client *session.Client) {
	if sess.StartTime > 0 || sess.ElapsedTime > 0 {
		sendToSession(sess, "play", strconv.FormatInt(sess.StartTime, 10)+","+strconv.Itoa(sess.ElapsedTime), client)
	}
}

func readAndProcessMessages(conn *websocket.Conn, sess *session.Session, client *session.Client) {
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			delete(sess.Clients, client)
			session.CheckAndCloseSessionIfEmpty(sess)
			break
		}

		var msg session.Message
		json.Unmarshal(message, &msg)

		fmt.Println(msg)

		switch msg.Action {
		case "pause":
			sendToSession(sess, "pause", msg.Data, nil)
		case "play":
			sendToSession(sess, "play", msg.Data, nil)
		}
	}
}

func sendToSession(sess *session.Session, action string, data string, targetClient *session.Client) {
	session.CalculateSessionTime(sess, action)

	message := session.Message{
		Action:      action,
		Data:        data,
		StartTime:   sess.StartTime,
		ElapsedTime: sess.ElapsedTime,
	}
	messageBytes, _ := json.Marshal(message)

	if targetClient != nil {
		err := targetClient.Conn.WriteMessage(websocket.TextMessage, messageBytes)
		if err != nil {
			delete(sess.Clients, targetClient)
		}
	} else {
		sess.Broadcast <- messageBytes
	}
}

func main() {
	http.HandleFunc("/ws/join", handleWebSocketJoin)
	http.HandleFunc("/ws/create", handleWebSocketCreate)
	fmt.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
