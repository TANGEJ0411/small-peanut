package com.smallpeanut.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smallpeanut.service.AppSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@RestController
@RequestMapping("/api/v1/line")
@RequiredArgsConstructor
public class LineWebhookController {

    private final AppSettingsService settingsService;
    private final ObjectMapper objectMapper;

    @Value("${line.bot.channel-secret:}")
    private String channelSecret;

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(
            @RequestHeader(value = "X-Line-Signature", required = false) String signature,
            @RequestBody String body) {

        if (!verifySignature(body, signature)) {
            return ResponseEntity.badRequest().build();
        }

        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode events = root.path("events");
            for (JsonNode event : events) {
                if ("message".equals(event.path("type").asText())) {
                    JsonNode source = event.path("source");
                    if ("group".equals(source.path("type").asText())) {
                        String groupId = source.path("groupId").asText(null);
                        if (groupId != null) {
                            settingsService.updateLineGroupId(groupId);
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }

        return ResponseEntity.ok("OK");
    }

    private boolean verifySignature(String body, String signature) {
        if (channelSecret.isBlank() || signature == null) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(channelSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash).equals(signature);
        } catch (Exception e) {
            return false;
        }
    }
}
