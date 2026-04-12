package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, String> payload,
            @AuthenticationPrincipal OAuth2User principal) {
        try {
            Order newOrder = orderService.placeOrder(payload, principal.getAttribute("email"));
            return ResponseEntity.ok(newOrder);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(@AuthenticationPrincipal OAuth2User principal) {
        return ResponseEntity.ok(orderService.getMyOrders(principal.getAttribute("email")));
    }

    @GetMapping("/my-deliveries")
    public ResponseEntity<List<Order>> getMyDeliveries(@AuthenticationPrincipal OAuth2User principal) {
        return ResponseEntity.ok(orderService.getMyDeliveries(principal.getAttribute("email")));
    }

    @GetMapping("/available")
    public ResponseEntity<List<Order>> getAvailableOrders(@AuthenticationPrincipal OAuth2User principal) {
        return ResponseEntity.ok(orderService.getAvailableOrders(principal.getAttribute("email")));
    }

    @PostMapping("/propose/{orderId}")
    public ResponseEntity<?> propose(@PathVariable Long orderId, @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal OAuth2User principal) {
        try {
            Order o = orderService.proposeOrder(orderId, payload, principal.getAttribute("email"));
            return ResponseEntity.ok(o);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    // Only the customer who owns the order can confirm the handshake
    @PostMapping("/confirm-handshake/{orderId}")
    public ResponseEntity<?> confirm(@PathVariable Long orderId,
            @AuthenticationPrincipal OAuth2User principal) {
        String email = principal.getAttribute("email");
        Optional<Order> orderOpt = orderRepository.findById(orderId);

        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Order not found"));
        }

        Order order = orderOpt.get();
        if (!order.getUser().getEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not your order"));
        }

        Order o = orderService.confirmHandshake(orderId);
        return ResponseEntity.ok(o);
    }

    // Only the customer who owns the order can reject the handshake
    @PostMapping("/reject-handshake/{orderId}")
    public ResponseEntity<?> rejectHandshake(@PathVariable Long orderId,
            @AuthenticationPrincipal OAuth2User principal) {
        String email = principal.getAttribute("email");
        Optional<Order> orderOpt = orderRepository.findById(orderId);

        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Order not found"));
        }

        Order order = orderOpt.get();
        if (!order.getUser().getEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not your order"));
        }

        Order o = orderService.rejectHandshake(orderId);
        return ResponseEntity.ok(o);
    }

    // Only the assigned deliverer can complete the order
    @PostMapping("/complete/{orderId}")
    public ResponseEntity<?> completeOrder(@PathVariable Long orderId,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal OAuth2User principal) {
        String email = principal.getAttribute("email");
        Optional<Order> orderOpt = orderRepository.findById(orderId);

        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Order not found"));
        }

        Order order = orderOpt.get();
        User caller = userRepository.findByEmail(email).orElseThrow();

        if (!caller.getId().equals(order.getDelivererId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not your delivery"));
        }

        try {
            orderService.completeOrder(orderId, payload.get("otp"));
            return ResponseEntity.ok(Map.of("message", "Success"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{orderId}/chat")
    public ResponseEntity<?> getChat(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getChat(orderId));
    }

    @PostMapping("/{orderId}/chat/send")
    public ResponseEntity<?> sendMessage(@PathVariable Long orderId,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal OAuth2User p) {
        orderService.sendMessage(orderId, payload.get("text"), p.getAttribute("name"), p.getAttribute("email"));
        return ResponseEntity.ok().build();
    }
}