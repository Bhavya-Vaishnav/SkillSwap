package com.bhavya.skillswap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class SkillswapApplication {

	public static void main(String[] args) {
		SpringApplication.run(SkillswapApplication.class, args);
	}

}
