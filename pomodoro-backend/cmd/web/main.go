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
	Id          string           `json:"id"`
	Public      bool             `json:"public"`
	Clients     map[*Client]bool `json:"-"`
	Broadcast   chan []byte      `json:"-"`
	StartTime   int64            `json:"startTime"`
	ElapsedTime int              `json:"elapsedTime"`
	Quit        chan bool        `json:"-"`
}

type Message struct {
	Action      string `json:"action"`
	Data        string `json:"data"`
	StartTime   int64  `json:"startTime"`
	ElapsedTime int    `json:"elapsedTime"`
}

var sessions = make(map[string]*Session)
var sessionsMutex = &sync.Mutex{}

func main() {
	http.HandleFunc("/ws/join", handleWebSocketJoin)
	http.HandleFunc("/ws/create", handleWebSocketCreate)
	http.HandleFunc("/getSessions", getPublicSessions)
	fmt.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

//session

func createSession(sessionID string) *Session {
	sessionsMutex.Lock()
	defer sessionsMutex.Unlock()

	session := &Session{
		Id:        sessionID,
		Public:    true,
		Clients:   make(map[*Client]bool),
		Broadcast: make(chan []byte),
		Quit:      make(chan bool),
	}
	go session.broadcastMessages()
	sessions[sessionID] = session

	return session
}

func getSession(sessionID string) (*Session, error) {
	sessionsMutex.Lock()
	defer sessionsMutex.Unlock()

	session, ok := sessions[sessionID]
	if !ok {
		return nil, fmt.Errorf("session not found")
	}

	return session, nil
}

func getPublicSessions(w http.ResponseWriter, r *http.Request) {
	sessionsMutex.Lock()
	defer sessionsMutex.Unlock()

	var sessionsAux []Session

	for _, v := range sessions {
		fmt.Println(v.Id)
		if v.Public {
			sessionsAux = append(sessionsAux, *v)
		}
	}

	jsonResp, err := json.Marshal(sessionsAux)
	// fmt.Println(string(jsonResp))

	if err != nil {
		log.Fatalf("Error happened in JSON marshal. Err: %s", err)
	}
	w.Write(jsonResp)
	return
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

func (s *Session) broadcastMessages() {
	for {
		select {
		case message := <-s.Broadcast:
			for client := range s.Clients {
				err := client.conn.WriteMessage(websocket.TextMessage, message)
				if err != nil {
					client.conn.Close() // Close the connection
					delete(s.Clients, client)
				}
			}

		case <-s.Quit:
			return
		}
	}
}

func checkAndCloseSessionIfEmpty(session *Session) {
	if len(session.Clients) == 0 {
		session.Quit <- true
		sessionsMutex.Lock()
		delete(sessions, session.Id)
		sessionsMutex.Unlock()
	}
}

//message

func readAndProcessMessages(conn *websocket.Conn, session *Session, client *Client) {
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			delete(session.Clients, client)
			checkAndCloseSessionIfEmpty(session)
			break
		}
		// fmt.Println(message)

		var msg Message
		json.Unmarshal(message, &msg)

		fmt.Println(msg)

		switch msg.Action {
		case "pause":
			sendMessageToSession(session, "pause", msg.Data, nil)
		case "play":
			sendMessageToSession(session, "play", msg.Data, nil)
		}
	}
}

func sendMessageToSession(session *Session, action string, data string, targetClient *Client) {
	calculateSessionTime(session, action)

	message := Message{
		Action:      action,
		Data:        data,
		StartTime:   session.StartTime,
		ElapsedTime: session.ElapsedTime,
	}
	messageBytes, _ := json.Marshal(message)

	if targetClient != nil {
		err := targetClient.conn.WriteMessage(websocket.TextMessage, messageBytes)
		if err != nil {
			delete(session.Clients, targetClient)
		}
	} else {
		session.Broadcast <- messageBytes
	}
}

func calculateSessionTime(session *Session, action string) {
	now := time.Now().UnixNano() / int64(time.Millisecond)
	if action == "play" {
		if session.StartTime == 0 {
			session.StartTime = now
		}
	} else if action == "pause" {
		if session.StartTime != 0 {
			elapsed := now - session.StartTime
			session.ElapsedTime += int(elapsed) / 1000
			session.StartTime = 0
		}
	}
}

//websocket

func handleWebSocketCreate(w http.ResponseWriter, r *http.Request) {
	conn, err := upgradeConnection(w, r)
	if err != nil {
		log.Println(err)
		return
	}

	sessionID := generateRandomSessionID()
	session := createSession(sessionID)
	client := &Client{conn: conn}
	session.Clients[client] = true
	sendStartingTimestampAndElapsedTime(session, client)
	sendMessageToSession(session, "created", sessionID, client)

	readAndProcessMessages(conn, session, client)
}

func handleWebSocketJoin(w http.ResponseWriter, r *http.Request) {
	conn, err := upgradeConnection(w, r)
	if err != nil {
		log.Println(err)
		return
	}

	sessionID := r.URL.Query().Get("session")
	session, err := getSession(sessionID)
	if err != nil {

		message := Message{
			Action: "error",
			Data:   "Session not found",
		}
		messageBytes, _ := json.Marshal(message)
		conn.WriteMessage(websocket.TextMessage, messageBytes)

		conn.Close()
		return
	}

	client := &Client{conn: conn}
	session.Clients[client] = true
	sendStartingTimestampAndElapsedTime(session, client)

	readAndProcessMessages(conn, session, client)
}

func upgradeConnection(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	conn, err := upgrader.Upgrade(w, r, nil)
	return conn, err
}

func createClientAndSession(r *http.Request, conn *websocket.Conn) (*Client, *Session, error) {
	client := &Client{conn: conn}
	sessionID := r.URL.Query().Get("session")
	session, error := getSession(sessionID)
	return client, session, error
}

func sendStartingTimestampAndElapsedTime(session *Session, client *Client) {
	if session.StartTime > 0 || session.ElapsedTime > 0 {
		sendMessageToSession(session, "play", strconv.FormatInt(session.StartTime, 10)+","+strconv.Itoa(session.ElapsedTime), client)
	}
}
