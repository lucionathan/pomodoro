package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

type Client struct {
	conn *websocket.Conn
}

type Session struct {
	id          string
	clients     map[*Client]bool
	broadcast   chan []byte
	startTime   int64
	elapsedTime int
	quit        chan bool
}

func (s *Session) broadcastMessages() {
	for {
		select {
		case message := <-s.broadcast:
			for client := range s.clients {
				err := client.conn.WriteMessage(websocket.TextMessage, message)
				if err != nil {
					client.conn.Close() // Close the connection
					delete(s.clients, client)
				}
			}

		case <-s.quit:
			return
		}
	}
}

type Message struct {
	Action      string `json:"action"`
	Data        string `json:"data"`
	StartTime   int64  `json:"startTime"`
	ElapsedTime int    `json:"elapsedTime"`
}

var sessions = make(map[string]*Session)
var sessionsMutex = &sync.Mutex{}

func handleWebSocketCreate(w http.ResponseWriter, r *http.Request) {
	conn, err := upgradeConnection(w, r)
	if err != nil {
		log.Println(err)
		return
	}

	sessionID := generateRandomSessionID()
	session := getSession(sessionID)
	client := &Client{conn: conn}
	session.clients[client] = true
	sendStartingTimestampAndElapsedTime(session, client)
	sendToSession(session, "created", sessionID, client)

	readAndProcessMessages(conn, session, client)
}

func handleWebSocketJoin(w http.ResponseWriter, r *http.Request) {
	conn, err := upgradeConnection(w, r)
	if err != nil {
		log.Println(err)
		return
	}

	client, session := createClientAndSession(r, conn)
	session.clients[client] = true
	sendStartingTimestampAndElapsedTime(session, client)

	readAndProcessMessages(conn, session, client)
}

func upgradeConnection(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	conn, err := upgrader.Upgrade(w, r, nil)
	return conn, err
}

func createClientAndSession(r *http.Request, conn *websocket.Conn) (*Client, *Session) {
	client := &Client{conn: conn}
	sessionID := r.URL.Query().Get("session")
	session := getSession(sessionID)
	return client, session
}

func sendStartingTimestampAndElapsedTime(session *Session, client *Client) {
	if session.startTime > 0 || session.elapsedTime > 0 {
		sendToSession(session, "play", strconv.FormatInt(session.startTime, 10)+","+strconv.Itoa(session.elapsedTime), client)
	}
}

func readAndProcessMessages(conn *websocket.Conn, session *Session, client *Client) {
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			delete(session.clients, client)
			checkAndCloseSessionIfEmpty(session)
			break
		}
		// fmt.Println(message)

		var msg Message
		json.Unmarshal(message, &msg)

		fmt.Println(msg)

		switch msg.Action {
		case "pause":
			sendToSession(session, "pause", msg.Data, nil)
		case "play":
			sendToSession(session, "play", msg.Data, nil)
		}
	}
}

func checkAndCloseSessionIfEmpty(session *Session) {
	if len(session.clients) == 0 {
		session.quit <- true
		sessionsMutex.Lock()
		delete(sessions, session.id)
		sessionsMutex.Unlock()
	}
}

func calculateSessionTime(session *Session, action string) {
	now := time.Now().UnixNano() / int64(time.Millisecond)
	if action == "play" {
		if session.startTime == 0 {
			session.startTime = now
		}
	} else if action == "pause" {
		if session.startTime != 0 {
			elapsed := now - session.startTime
			session.elapsedTime += int(elapsed) / 1000
			session.startTime = 0
		}
	}
}

func sendToSession(session *Session, action string, data string, targetClient *Client) {
	calculateSessionTime(session, action)

	message := Message{
		Action:      action,
		Data:        data,
		StartTime:   session.startTime,
		ElapsedTime: session.elapsedTime,
	}
	messageBytes, _ := json.Marshal(message)

	if targetClient != nil {
		err := targetClient.conn.WriteMessage(websocket.TextMessage, messageBytes)
		if err != nil {
			delete(session.clients, targetClient)
		}
	} else {
		session.broadcast <- messageBytes
	}
}

func getSession(sessionID string) *Session {
	sessionsMutex.Lock()
	defer sessionsMutex.Unlock()
	session, ok := sessions[sessionID]
	if !ok {
		session = &Session{
			id:        sessionID,
			clients:   make(map[*Client]bool),
			broadcast: make(chan []byte),
			quit:      make(chan bool),
		}
		go session.broadcastMessages()
		sessions[sessionID] = session
	}

	return session
}

func generateRandomSessionID() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const length = 8

	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}

	return string(b)
}

func main() {
	http.HandleFunc("/ws/join", handleWebSocketJoin)
	http.HandleFunc("/ws/create", handleWebSocketCreate)
	fmt.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
