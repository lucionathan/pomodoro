package main

import (
	"encoding/json"
	"fmt"
	"log"
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
	send chan []byte
}

type Session struct {
	clients   map[*Client]bool
	broadcast chan []byte
	//start time para calcular o tempo e sincronizar
	startTime   int64
	elapsedTime int
}

func (s *Session) run() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case message := <-s.broadcast:
			for client := range s.clients {
				client.send <- message
			}
		}
	}
}

func (c *Client) write() {
	defer c.conn.Close()

	for {
		select {
		case message := <-c.send:
			err := c.conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				return
			}
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

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := &Client{conn: conn, send: make(chan []byte, 256)}
	sessionID := r.URL.Query().Get("session")
	session := getSession(sessionID)
	session.clients[client] = true

	go client.write()

	// Send the starting timestamp and elapsed time to the new user
	if session.startTime > 0 || session.elapsedTime > 0 {
		sendToSession(session, "play", strconv.FormatInt(session.startTime, 10)+","+strconv.Itoa(session.elapsedTime), client)
	}
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			delete(session.clients, client)
			break
		}

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

func sendToSession(session *Session, action string, data string, targetClient *Client) {
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

	message := Message{
		Action:      action,
		Data:        data,
		StartTime:   session.startTime,
		ElapsedTime: session.elapsedTime,
	}
	messageBytes, _ := json.Marshal(message)

	if targetClient != nil {
		targetClient.send <- messageBytes
	} else {
		for client := range session.clients {
			client.send <- messageBytes
		}
	}
}

func getSession(sessionID string) *Session {
	sessionsMutex.Lock()
	defer sessionsMutex.Unlock()

	session, ok := sessions[sessionID]
	if !ok {
		session = &Session{
			clients:   make(map[*Client]bool),
			broadcast: make(chan []byte),
		}
		go session.run()
		sessions[sessionID] = session
	}

	return session
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)
	fmt.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
