CREATE DATABASE mapclickerbase;
USE mapClickerBase;

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userName VARCHAR(30) NOT NULL,
    userPassword VARCHAR(60) NOT NULL,
    clicks BIGINT NOT NULL,
    lastActivity BIGINT NOT NULL
);