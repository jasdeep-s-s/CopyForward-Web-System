<?php

$request = $_SERVER['REQUEST_URI'];

// Supprime les éventuels paramètres GET (?id=1)
$request = strtok($request, '?');

switch ($request) {
    case '/':
    case '/home':
        require __DIR__ . '/controllers/HomeController.php';
        $controller = new HomeController();
        $controller->index();
        break;

    case '/search':
        require __DIR__ . '/controllers/SearchController.php';
        $controller = new SearchController();
        $controller->index();
        break;

    default:
        http_response_code(404);
        echo "404 - Page not found";
        break;
}
