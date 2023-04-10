package session

import (
	"encoding/json"
	"math/rand"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn *websocket.Conn
}

type Session struct {
	ID          string
	Clients     map[*Client]bool
	Broadcast   chan []byte
	StartTime   int64
	ElapsedTime int
	Quit        chan bool
}

type Message struct {
	Action      string `json:"action"`
	Data        string `json:"data"`
	StartTime   int64  `json:"startTime"`
	ElapsedTime int    `json:"elapsedTime"`
}

var sessions = make(map[string]*Session)
var sessionsMutex = &sync.Mutex{}

func (s *Session) BroadcastMessages() {
	for {
		select {
		case message := <-s.Broadcast:
			for client := range s.Clients {
				err := client.Conn.WriteMessage(websocket.TextMessage, message)
				if err != nil {
					client.Conn.Close() // Close the connection
					delete(s.Clients, client)
				}
			}

		case <-s.Quit:
			return
		}
	}
}

func GetSession(sessionID string) *Session {
	sessionsMutex.Lock()
	defer sessionsMutex.Unlock()
	session, ok := sessions[sessionID]
	if !ok {
		session = &Session{
			ID:        sessionID,
			Clients:   make(map[*Client]bool),
			Broadcast: make(chan []byte),
			Quit:      make(chan bool),
		}
		go session.BroadcastMessages()
		sessions[sessionID] = session
	}

	return session
}

func GenerateRandomSessionID() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const length = 8

	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}

	return string(b)
}

func CalculateSessionTime(session *Session, action string) {
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

func SendToSession(session *Session, action string, data string, targetClient *Client) {
	CalculateSessionTime(session, action)

	message := Message{
		Action:      action,
		Data:        data,
		StartTime:   session.StartTime,
		ElapsedTime: session.ElapsedTime,
	}
	messageBytes, _ := json.Marshal(message)

	if targetClient != nil {
		err := targetClient.Conn.WriteMessage(websocket.TextMessage, messageBytes)
		if err != nil {
			delete(session.Clients, targetClient)
		}
	} else {
		session.Broadcast <- messageBytes
	}
}

func CheckAndCloseSessionIfEmpty(session *Session) {
	if len(session.Clients) == 0 {
		session.Quit <- true
		sessionsMutex.Lock()
		delete(sessions, session.ID)
		sessionsMutex.Unlock()
	}
}
