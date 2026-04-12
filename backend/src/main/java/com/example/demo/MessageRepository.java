package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // Fetches the chat log in order of when the messages were sent
    List<Message> findByOrderIdOrderByTimestampAsc(Long orderId);
    
    // Automatically wipes the chat from MySQL to save your storage space
    void deleteByOrderId(Long orderId);
}