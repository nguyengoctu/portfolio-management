-- Create skills table
CREATE TABLE skills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_category (category)
);

-- Create user_skills junction table (many-to-many)
CREATE TABLE user_skills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,
    proficiency_level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT') DEFAULT 'INTERMEDIATE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_skill (user_id, skill_id),
    INDEX idx_user_id (user_id),
    INDEX idx_skill_id (skill_id)
);

-- Insert some default skills
INSERT INTO skills (name, category, color) VALUES
-- Programming Languages
('Java', 'Programming', '#ED8B00'),
('Python', 'Programming', '#3776AB'),
('JavaScript', 'Programming', '#F7DF1E'),
('TypeScript', 'Programming', '#3178C6'),
('Go', 'Programming', '#00ADD8'),
('C#', 'Programming', '#239120'),
('C++', 'Programming', '#00599C'),
('Rust', 'Programming', '#000000'),

-- Frameworks & Libraries
('Spring Boot', 'Framework', '#6DB33F'),
('React', 'Framework', '#61DAFB'),
('Angular', 'Framework', '#DD0031'),
('Vue.js', 'Framework', '#4FC08D'),
('Node.js', 'Framework', '#339933'),
('.NET', 'Framework', '#512BD4'),

-- DevOps & Infrastructure
('Docker', 'DevOps', '#2496ED'),
('Kubernetes', 'DevOps', '#326CE5'),
('Jenkins', 'DevOps', '#D33833'),
('GitLab CI', 'DevOps', '#FC6D26'),
('GitHub Actions', 'DevOps', '#2088FF'),
('Terraform', 'DevOps', '#7B42BC'),
('AWS', 'Cloud', '#232F3E'),
('Azure', 'Cloud', '#0078D4'),
('GCP', 'Cloud', '#4285F4'),

-- Databases
('PostgreSQL', 'Database', '#336791'),
('MySQL', 'Database', '#4479A1'),
('MongoDB', 'Database', '#47A248'),
('Redis', 'Database', '#DC382D'),
('Elasticsearch', 'Database', '#005571'),

-- Tools & Technologies
('Git', 'Tool', '#F05032'),
('Linux', 'Tool', '#FCC624'),
('Nginx', 'Tool', '#009639'),
('Apache', 'Tool', '#D22128'),
('Kafka', 'Tool', '#231F20'),
('RabbitMQ', 'Tool', '#FF6600');