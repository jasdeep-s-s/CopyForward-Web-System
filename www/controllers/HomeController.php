<?php

class HomeController {
    public function index() {
        $pdo = require __DIR__ . '/../conf2/database.php';

        // Get search parameters
        $topicId = isset($_GET['topic']) ? (int)$_GET['topic'] : null;
        $authorId = isset($_GET['author']) ? (int)$_GET['author'] : null;
        $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

        // Get base data
        $authors = $pdo->query("SELECT * FROM authors")->fetchAll(PDO::FETCH_ASSOC);
        $topics = $pdo->query("SELECT * FROM topics")->fetchAll(PDO::FETCH_ASSOC);

        // If a search is performed, display the results
        $searchResults = null;
        $hasSearch = !empty($topicId) || !empty($authorId) || !empty($keyword);

        if ($hasSearch) {
            $query = "SELECT * FROM items WHERE 1=1";
            $params = [];

            if (!empty($topicId)) {
                $query .= " AND topic_id = :topic_id";
                $params[':topic_id'] = $topicId;
            }

            if (!empty($authorId)) {
                $query .= " AND author_id = :author_id";
                $params[':author_id'] = $authorId;
            }

            if (!empty($keyword)) {
                $query .= " AND (title LIKE :keyword OR description LIKE :keyword)";
                $params[':keyword'] = '%' . $keyword . '%';
            }

            $query .= " ORDER BY created_at DESC";

            $stmt = $pdo->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $searchResults = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        // Normal data if no search
        $popular = $hasSearch ? [] : $pdo->query("SELECT * FROM items ORDER BY downloads DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
        $new = $hasSearch ? [] : $pdo->query("SELECT * FROM items ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);

        require __DIR__ . '/../views/home.php';
    }
}
