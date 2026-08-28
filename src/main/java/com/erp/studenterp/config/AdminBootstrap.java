package com.erp.studenterp.config;

import com.erp.studenterp.entity.Role;
import com.erp.studenterp.entity.User;
import com.erp.studenterp.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the first administrator on an empty database. Account creation is an
 * admin-only endpoint, so without this nobody could ever sign in to a fresh install.
 */
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin-email:admin@studenterp.local}")
    private String adminEmail;

    @Value("${app.bootstrap.admin-password:}")
    private String adminPassword;

    @Value("${app.bootstrap.admin-name:System Administrator}")
    private String adminName;

    @Override
    public void run(String... args) {

        if (userRepository.existsByRole(Role.ADMIN)) {
            return;
        }

        if (adminPassword == null || adminPassword.isBlank()) {
            log.warn("""
                    No administrator exists and app.bootstrap.admin-password is not set.
                    Set APP_BOOTSTRAP_ADMIN_PASSWORD (and optionally APP_BOOTSTRAP_ADMIN_EMAIL) \
                    and restart to create the first admin account.""");
            return;
        }

        User admin = new User();
        admin.setFullName(adminName);
        admin.setEmail(adminEmail.trim().toLowerCase());
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);

        userRepository.save(admin);

        log.info("Created the bootstrap administrator account {}", admin.getEmail());
    }
}
