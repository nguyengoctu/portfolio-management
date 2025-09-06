package com.example.chatservice.repository;

import com.example.chatservice.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1) " +
           "ORDER BY m.timestamp ASC")
    List<ChatMessage> findMessagesBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    @Query("SELECT m FROM ChatMessage m WHERE m.receiverId = :receiverId AND m.isRead = false ORDER BY m.timestamp ASC")
    List<ChatMessage> findUnreadMessagesForUser(@Param("receiverId") Long receiverId);

    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.senderId = :senderId AND m.receiverId = :receiverId AND m.isRead = false")
    void markMessagesAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.receiverId = :receiverId AND m.isRead = false")
    Long countUnreadMessagesForUser(@Param("receiverId") Long receiverId);

    @Query("SELECT m FROM ChatMessage m WHERE m.senderId = :senderId ORDER BY m.timestamp DESC")
    List<ChatMessage> findMessagesBySender(@Param("senderId") Long senderId);

    @Query("SELECT m FROM ChatMessage m WHERE m.receiverId = :receiverId ORDER BY m.timestamp DESC")
    List<ChatMessage> findMessagesByReceiver(@Param("receiverId") Long receiverId);

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1) " +
           "AND m.timestamp >= :timestamp " +
           "ORDER BY m.timestamp ASC")
    List<ChatMessage> findMessagesBetweenUsersAfterTimestamp(
        @Param("userId1") Long userId1, 
        @Param("userId2") Long userId2, 
        @Param("timestamp") LocalDateTime timestamp);
}