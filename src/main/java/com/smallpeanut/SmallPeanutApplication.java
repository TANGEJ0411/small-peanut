package com.smallpeanut;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmallPeanutApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmallPeanutApplication.class, args);
    }
}
