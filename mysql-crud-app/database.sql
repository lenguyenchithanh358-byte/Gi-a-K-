CREATE DATABASE IF NOT EXISTS student_db;
USE student_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  fullname VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_code VARCHAR(20) UNIQUE NOT NULL,
  fullname VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  major VARCHAR(100) NOT NULL,
  gpa FLOAT DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample students
INSERT INTO students (student_code, fullname, email, major, gpa) VALUES
('SV001', 'Nguyen Van A', 'anguyen@gmail.com', 'Cong nghe thong tin', 3.5),
('SV002', 'Tran Thi B', 'btran@gmail.com', 'Quan tri kinh doanh', 3.2),
('SV003', 'Le Van C', 'cle@gmail.com', 'Khoa hoc may tinh', 3.8)
ON DUPLICATE KEY UPDATE student_code=student_code;
