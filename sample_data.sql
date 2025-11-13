-- Sample Data for CopyForward Web System
-- Database: docker
-- 
-- Instructions:
-- 1. Open phpMyAdmin
-- 2. Select the 'docker' database
-- 3. Go to the SQL tab
-- 4. Copy and paste this entire file
-- 5. Click "Go" to execute

-- Clear existing data (optional - uncomment if you want to reset)
-- TRUNCATE TABLE items;
-- TRUNCATE TABLE authors;
-- TRUNCATE TABLE topics;

-- Insert Authors
INSERT INTO authors (id, name) VALUES
(1, 'Sarah Johnson'),
(2, 'Michael Chen'),
(3, 'Emily Rodriguez'),
(4, 'David Thompson'),
(5, 'Jessica Williams'),
(6, 'Robert Martinez'),
(7, 'Amanda Davis'),
(8, 'James Wilson');

-- Insert Topics
INSERT INTO topics (id, name) VALUES
(1, 'Web Development'),
(2, 'Data Science'),
(3, 'Mobile Development'),
(4, 'Cloud Computing'),
(5, 'Cybersecurity'),
(6, 'Machine Learning'),
(7, 'DevOps'),
(8, 'UI/UX Design');

-- Insert Items (Articles)
INSERT INTO items (id, title, description, author_id, topic_id, downloads, created_at) VALUES
(1, 'Getting Started with React Hooks', 'Learn how to use React Hooks to build modern, functional components. This comprehensive guide covers useState, useEffect, and custom hooks with practical examples.', 1, 1, 1523, '2024-01-15 10:30:00'),
(2, 'Introduction to Python Data Analysis', 'Discover the power of pandas and numpy for data manipulation and analysis. Perfect for beginners looking to dive into data science.', 2, 2, 2847, '2024-01-20 14:15:00'),
(3, 'Building RESTful APIs with Node.js', 'A step-by-step tutorial on creating robust REST APIs using Express.js. Includes authentication, error handling, and best practices.', 3, 1, 1921, '2024-02-01 09:45:00'),
(4, 'Flutter Mobile App Development Guide', 'Complete guide to building cross-platform mobile applications with Flutter. Covers widgets, state management, and deployment strategies.', 4, 3, 1654, '2024-02-10 16:20:00'),
(5, 'AWS Cloud Architecture Best Practices', 'Learn how to design scalable and cost-effective cloud solutions on AWS. Includes real-world examples and architectural patterns.', 5, 4, 2234, '2024-02-15 11:00:00'),
(6, 'Cybersecurity Fundamentals for Developers', 'Essential security practices every developer should know. Covers OWASP Top 10, encryption, and secure coding techniques.', 6, 5, 1876, '2024-02-20 13:30:00'),
(7, 'Machine Learning with TensorFlow', 'Hands-on introduction to machine learning using TensorFlow. Build your first neural network and understand the fundamentals of ML.', 2, 6, 3124, '2024-03-01 10:15:00'),
(8, 'Docker and Kubernetes Deployment', 'Master containerization and orchestration with Docker and Kubernetes. Learn to deploy applications at scale.', 7, 7, 2456, '2024-03-05 15:45:00'),
(9, 'Modern UI Design Principles', 'Explore the latest trends in user interface design. Learn about color theory, typography, and creating intuitive user experiences.', 8, 8, 1789, '2024-03-10 12:00:00'),
(10, 'Advanced JavaScript Patterns', 'Deep dive into advanced JavaScript concepts including closures, prototypes, async/await, and design patterns.', 1, 1, 2103, '2024-03-15 09:30:00'),
(11, 'Data Visualization with D3.js', 'Create stunning interactive data visualizations using D3.js. Learn to transform data into beautiful charts and graphs.', 3, 2, 1567, '2024-03-20 14:20:00'),
(12, 'iOS App Development with Swift', 'Complete guide to building native iOS applications using Swift and Xcode. Covers UIKit, SwiftUI, and app store submission.', 4, 3, 1987, '2024-03-25 11:45:00'),
(13, 'Azure Cloud Services Overview', 'Comprehensive overview of Microsoft Azure services. Learn about virtual machines, storage, and serverless computing.', 5, 4, 1678, '2024-04-01 10:00:00'),
(14, 'Penetration Testing Basics', 'Introduction to ethical hacking and penetration testing. Learn common vulnerabilities and how to protect against them.', 6, 5, 1456, '2024-04-05 13:15:00'),
(15, 'Deep Learning Fundamentals', 'Understand the basics of deep learning and neural networks. Build image recognition models and natural language processing systems.', 2, 6, 2789, '2024-04-10 15:30:00'),
(16, 'CI/CD Pipeline with Jenkins', 'Set up continuous integration and deployment pipelines using Jenkins. Automate your development workflow.', 7, 7, 1890, '2024-04-15 12:45:00'),
(17, 'Responsive Web Design Mastery', 'Master the art of creating websites that work perfectly on all devices. Learn CSS Grid, Flexbox, and media queries.', 8, 8, 2134, '2024-04-20 09:00:00'),
(18, 'Vue.js 3 Composition API', 'Explore the new Composition API in Vue.js 3. Learn reactive programming and component composition techniques.', 1, 1, 1765, '2024-04-25 14:30:00'),
(19, 'Big Data Processing with Apache Spark', 'Process large datasets efficiently using Apache Spark. Learn about RDDs, DataFrames, and Spark SQL.', 3, 2, 2012, '2024-05-01 11:20:00'),
(20, 'Android Development with Kotlin', 'Build modern Android applications using Kotlin. Learn about coroutines, Jetpack libraries, and Material Design.', 4, 3, 2345, '2024-05-05 16:00:00'),
(21, 'Google Cloud Platform Essentials', 'Get started with Google Cloud Platform. Learn about Compute Engine, Cloud Storage, and App Engine.', 5, 4, 1598, '2024-05-10 10:45:00'),
(22, 'Network Security Protocols', 'Understand SSL/TLS, VPNs, and other network security protocols. Learn to secure network communications.', 6, 5, 1876, '2024-05-15 13:00:00'),
(23, 'Natural Language Processing Guide', 'Introduction to NLP techniques using Python. Learn about tokenization, sentiment analysis, and text classification.', 2, 6, 2654, '2024-05-20 15:15:00'),
(24, 'Git Workflow Best Practices', 'Master Git version control with branching strategies, merge techniques, and collaboration workflows.', 7, 7, 1723, '2024-05-25 12:30:00'),
(25, 'Design Systems and Component Libraries', 'Create reusable design systems and component libraries. Learn about Storybook and design tokens.', 8, 8, 1945, '2024-06-01 09:45:00');

