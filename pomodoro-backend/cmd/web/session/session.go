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

	"github.com/gorilla/mux"
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
	Username    string `json:"username"`
}

var sessions = make(map[string]*Session)
var sessionsMutex = &sync.RWMutex{}

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

func GetUsernamesInSession(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["sessionID"]
	if sessionID == "" {
		http.Error(w, "Missing sessionId parameter", http.StatusBadRequest)
		return
	}

	sessionsMutex.RLock()
	defer sessionsMutex.RUnlock()

	session, ok := sessions[sessionID]
	if !ok {
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}

	usernamesMap := make(map[string]bool)
	for client := range session.Clients {
		usernamesMap[client.Username] = true
	}

	usernamesSlice := make([]string, 0, len(usernamesMap))
	for username := range usernamesMap {
		usernamesSlice = append(usernamesSlice, username)
	}

	jsonResp, err := json.Marshal(usernamesSlice)
	if err != nil {
		http.Error(w, "Error marshalling JSON", http.StatusInternalServerError)
		return
	}

	w.Write(jsonResp)
}

func GetSession(sessionID string) (*Session, error) {
	sessionsMutex.RLock()
	defer sessionsMutex.RUnlock()

	session, ok := sessions[sessionID]
	if !ok {
		return nil, fmt.Errorf("session not found")
	}

	return session, nil
}

func GetPublicSessions(w http.ResponseWriter, r *http.Request) {
	sessionsMutex.RLock()
	defer sessionsMutex.RUnlock()

	var sessionsAux []Session

	for _, v := range sessions {
		if v.Public {
			sessionsAux = append(sessionsAux, *v)
		}
	}

	jsonResp, err := json.Marshal(sessionsAux)

	if err != nil {
		log.Fatalf("Error happened in JSON marshal. Err: %s", err)
	}

	w.Write(jsonResp)
}

func GetClientsInSession(w http.ResponseWriter, r *http.Request) {
	sessionsMutex.RLock()
	defer sessionsMutex.RUnlock()

	vars := mux.Vars(r)
	sessionId := vars["sessionId"]

	session, ok := sessions[sessionId]
	if !ok {
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}

	var usernames []string
	for client := range session.Clients {
		usernames = append(usernames, client.Username)
	}

	jsonResponse, err := json.Marshal(usernames)
	if err != nil {
		http.Error(w, "Error marshalling JSON", http.StatusInternalServerError)
		return
	}

	w.Write(jsonResponse)
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
					client.Conn.Close()
					delete(s.Clients, client)
				}
			}

		case <-s.Quit:
			return
		}
	}
}

func checkAndCloseSessionIfEmpty(session *Session) {
	sessionsMutex.Lock()
	defer sessionsMutex.Unlock()

	if len(session.Clients) == 0 {
		session.Quit <- true
		delete(sessions, session.Id)
	}
}

//message

func ReadAndProcessMessages(conn *websocket.Conn, session *Session, client *client.Client) {
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			sessionsMutex.Lock()
			SendMessageToSession(session, "userLeft", client.Username, nil, "")
			delete(session.Clients, client)
			checkAndCloseSessionIfEmpty(session)
			sessionsMutex.Unlock()
			break
		}

		var msg Message
		err = json.Unmarshal(message, &msg)
		if err != nil {
			continue
		}

		msg.Username = client.Username

		fmt.Println(msg)

		sessionsMutex.Lock()
		switch msg.Action {
		case "pause":
			SendMessageToSession(session, "pause", msg.Data, nil, msg.Username)
		case "play":
			SendMessageToSession(session, "play", msg.Data, nil, msg.Username)
		case "chat":
			SendMessageToSession(session, "chat", msg.Data, nil, msg.Username)
		}
		sessionsMutex.Unlock()
	}
}

func SendMessageToSession(session *Session, action string, data string, targetClient *client.Client, username string) {
	calculateSessionTime(session, action)

	message := Message{
		Action:      action,
		Data:        data,
		StartTime:   session.StartTime,
		ElapsedTime: session.ElapsedTime,
		Username:    username,
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
		SendMessageToSession(session, "play", strconv.FormatInt(session.StartTime, 10)+","+strconv.Itoa(session.ElapsedTime), client, "")
	}
}
