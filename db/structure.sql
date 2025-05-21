DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id BINARY(16) PRIMARY KEY,
  username VARCHAR(30) UNIQUE,
  passwd VARCHAR(100)
);

DROP TABLE IF EXISTS classes;
CREATE TABLE classes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  class VARCHAR(30),
  network VARCHAR(40) UNIQUE
);

DROP TABLE IF EXISTS hosts;
CREATE TABLE hosts (
  ip VARCHAR(24) PRIMARY KEY,
  class_id INT REFERENCES classes(id) ON DELETE CASCADE,
  blocked TINYINT(1) NOT NULL DEFAULT 0
);

INSERT INTO classes (class, network) VALUES 
  ('Clase 1', '192.168.1.0/24'), 
  ('Clase 2', '10.69.20.0/24'), 
  ('Clase 3', '10.69.30.0/24');