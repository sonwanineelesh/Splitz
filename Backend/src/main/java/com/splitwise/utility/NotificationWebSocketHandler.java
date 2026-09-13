//package com.splitwise.utility;
//import java.io.IOException;
//import java.util.HashSet;
//import java.util.Set;
//
//import org.springframework.context.annotation.Configuration;
//import org.springframework.web.socket.CloseStatus;
//import org.springframework.web.socket.TextMessage;
//import org.springframework.web.socket.WebSocketSession;
//import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
////import org.springframework.web.socket.WebSocketSession;
////import org.springframework.web.socket.handler.TextWebSocketHandler;
//import org.springframework.web.socket.handler.TextWebSocketHandler;
//@Configuration
//@EnableWebSocketMessageBroker
//public class NotificationWebSocketHandler extends TextWebSocketHandler {
//
//    private final Set<WebSocketSession> sessions = new HashSet<>();
//
//    @Override
//    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
//        sessions.add(session);
//    }
//
//    @Override
//    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
//        sessions.remove(session);
//    }
//
//    public void sendNotification(String message) {
//        for (WebSocketSession session : sessions) {
//            try {
//                session.sendMessage(new TextMessage(message));
//            } catch (IOException e) {
//                e.printStackTrace();
//            }
//        }
//    }
//}
//
