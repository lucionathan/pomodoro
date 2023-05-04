package session

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
	"github.com/lucionathan/pomodoro/cmd/web/client"
)

type Session struct {
	Id          string                  `json:"id"`
	Public      bool                    `json:"public"`
	Clients     map[*client.Client]bool `json:"-"`
	Broadcast   chan []byte             `json:"-"`
	StartTime   int64                   `json:"startTime"`
	ElapsedTime int                     `json:"elapsedTime"`
	Quit        chan bool               `json:"-"`
}

type Message struct {
	Action      string `json:"action"`
	Data        string `json:"data"`
	StartTime   int64  `json:"startTime"`
	ElapsedTime int    `json:"elapsedTime"`
}

var sessions = make(map[string]*Session)
var sessionsMutex = &sync.Mutex{}

func CreateSession(sessionID string, isPublic bool) *Session {
	sessionsMutex.Lock()
	defer sessionsMutex.Unlock()

	session := &Session{
		Id:        sessionID,
		Public:    isPublic,
		Clients:   make(map[*client.Client]bool),
		Broadcast: make(chan []byte),
		Quit:      make(chan bool),
	}
	go session.BroadcastMessages()
	sessions[sessionID] = session

	return session
}

func GetSession(sessionID string) (*Session, error) {
	sessionsMutex.Lock()
	defer sessionsMutex.Unlock()

	session, ok := sessions[sessionID]
	if !ok {
		return nil, fmt.Errorf("session not found")
	}

	return session, nil
}

func GetPublicSessions(w http.ResponseWriter, r *http.Request) {
	sessionsMutex.Lock()
	defer sessionsMutex.Unlock()

	var sessionsAux []Session

	for _, v := range sessions {
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

func GenerateRandomSessionID() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const length = 8

	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}

	return string(b)
}

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

func checkAndCloseSessionIfEmpty(session *Session) {
	if len(session.Clients) == 0 {
		session.Quit <- true
		sessionsMutex.Lock()
		delete(sessions, session.Id)
		sessionsMutex.Unlock()
	}
}

//message

func ReadAndProcessMessages(conn *websocket.Conn, session *Session, client *client.Client) {
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
			SendMessageToSession(session, "pause", msg.Data, nil)
		case "play":
			SendMessageToSession(session, "play", msg.Data, nil)
		case "chat":
			SendMessageToSession(session, "chat", msg.Data, nil)
		}
	}
}

func SendMessageToSession(session *Session, action string, data string, targetClient *client.Client) {
	calculateSessionTime(session, action)

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

func SendStartingTimestampAndElapsedTime(session *Session, client *client.Client) {
	if session.StartTime > 0 || session.ElapsedTime > 0 {
		SendMessageToSession(session, "play", strconv.FormatInt(session.StartTime, 10)+","+strconv.Itoa(session.ElapsedTime), client)
	}
}
