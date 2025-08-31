CREATE TABLE password_reset_token (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255),
    user_id BIGINT NOT NULL,
    expiry_date DATETIME(6),
    CONSTRAINT FK_password_reset_token_user FOREIGN KEY (user_id) REFERENCES users(id)
);