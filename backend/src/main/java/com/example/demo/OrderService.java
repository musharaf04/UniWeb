package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Transactional
    public Order placeOrder(Map<String, String> payload, String email) {
        User user = userRepository.findByEmail(email).orElseThrow();

        if (user.getPoints() < 10) {
            throw new IllegalArgumentException("Insufficient points!");
        }

        user.setPoints(user.getPoints() - 10);
        userRepository.save(user);

        Order newOrder = new Order();
        newOrder.setUser(user);
        newOrder.setItemDescription(payload.get("itemDescription"));
        newOrder.setDeliveryAddress(payload.get("deliveryAddress"));
        newOrder.setPickupAddress(payload.get("pickupAddress"));
        newOrder.setStatus(OrderStatus.PENDING);
        return orderRepository.save(newOrder);
    }

    public List<Order> getMyOrders(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return orderRepository.findByUserId(user.getId());
    }

    public List<Order> getMyDeliveries(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return orderRepository.findByDelivererId(user.getId());
    }

    public List<Order> getAvailableOrders(String email) {
        User currentUser = userRepository.findByEmail(email).orElseThrow();
        List<Order> allPending = orderRepository.findByStatus(OrderStatus.PENDING);

        return allPending.stream()
                .filter(order -> order.getUser().getGender().equalsIgnoreCase(currentUser.getGender()))
                .toList();
    }

    @Transactional
    public Order proposeOrder(Long orderId, Map<String, String> payload, String email) {
        Order o = orderRepository.findById(orderId).orElseThrow();

        // --- RACE CONDITION FIX ---
        if (o.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Order is no longer available.");
        }

        User d = userRepository.findByEmail(email).orElseThrow();

        o.setStatus(OrderStatus.APPROVAL_PENDING);
        o.setDelivererId(d.getId());
        o.setDelivererLocation(payload.get("currentLocation"));
        o.setEstimatedTime(payload.get("estTime"));
        return orderRepository.save(o);
    }

    @Transactional
    public Order confirmHandshake(Long orderId) {
        Order o = orderRepository.findById(orderId).orElseThrow();
        o.setStatus(OrderStatus.ACCEPTED);

        if (o.getDeliveryOtp() == null) {
            String otp = String.format("%04d", new Random().nextInt(10000));
            o.setDeliveryOtp(otp);
        }

        return orderRepository.save(o);
    }

    @Transactional
    public Order rejectHandshake(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow();

        order.setStatus(OrderStatus.PENDING);
        order.setDelivererId(null);
        order.setDelivererLocation(null);
        order.setEstimatedTime(null);
        order.setDeliveryOtp(null);
        return orderRepository.save(order);
    }

    @Transactional
    public void completeOrder(Long orderId, String enteredOtp) {
        Order o = orderRepository.findById(orderId).orElseThrow();

        if (OrderStatus.COMPLETED.equals(o.getStatus())) {
            throw new IllegalStateException("Already completed");
        }
        if (o.getDeliveryOtp() == null || !o.getDeliveryOtp().equals(enteredOtp)) {
            throw new IllegalArgumentException("Invalid OTP");
        }

        o.setStatus(OrderStatus.COMPLETED);
        User deliverer = userRepository.findById(o.getDelivererId()).orElseThrow();
        deliverer.setPoints(deliverer.getPoints() + 10);

        userRepository.save(deliverer);
        orderRepository.save(o);

        // --- STORAGE SAVER: Delete chat history when order is completed ---
        messageRepository.deleteByOrderId(orderId);
    }

    public List<Map<String, String>> getChat(Long orderId) {
        List<Message> messages = messageRepository.findByOrderIdOrderByTimestampAsc(orderId);

        // Translate the database rows into JSON safely handling potential nulls
        return messages.stream().map(m -> {
            Map<String, String> map = new java.util.HashMap<>();
            map.put("sender", m.getSenderName() != null ? m.getSenderName() : "Unknown");
            map.put("email", m.getSenderEmail() != null ? m.getSenderEmail() : "unknown@example.com");
            map.put("text", m.getText() != null ? m.getText() : "");
            return map;
        }).toList();
    }

    public void sendMessage(Long orderId, String text, String senderName, String senderEmail) {
        Message msg = new Message();
        msg.setOrderId(orderId);
        msg.setText(text);
        msg.setSenderName(senderName);
        msg.setSenderEmail(senderEmail);
        messageRepository.save(msg);
    }
}