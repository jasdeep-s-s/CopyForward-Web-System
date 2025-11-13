<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home - CopyForward</title>
  <link rel="stylesheet" href="/assets/css/home.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>🏠 Home</h1>
      <p class="subtitle">Discover the best articles and resources</p>
    </header>

    <?php if ($hasSearch): ?>
      <!-- Search Results -->
      <section class="section-card" style="max-width: 100%;">
        <h2>🔍 Search Results</h2>
        <?php if (empty($searchResults)): ?>
          <p class="empty-state">No results found for your search.</p>
        <?php else: ?>
          <p style="margin-bottom: 1rem; color: var(--text-secondary);">
            <?= count($searchResults) ?> result(s) found
          </p>
          <ul class="items-list">
            <?php foreach ($searchResults as $item): ?>
              <li class="item">
                <div class="item-title"><?= htmlspecialchars($item['title']) ?></div>
                <div class="item-meta">
                  <span class="badge">📥 <?= number_format($item['downloads'], 0, ',', ' ') ?> downloads</span>
                  <span class="date">📅 <?= date('M d, Y', strtotime($item['created_at'])) ?></span>
                </div>
              </li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>
      </section>
    <?php else: ?>
      <div class="main-grid">
        <!-- Popular Articles -->
        <section class="section-card">
          <h2>📈 Popular Articles</h2>
          <?php if (empty($popular)): ?>
            <p class="empty-state">No popular articles at the moment</p>
          <?php else: ?>
            <ul class="items-list">
              <?php foreach ($popular as $item): ?>
                <li class="item">
                  <div class="item-title"><?= htmlspecialchars($item['title']) ?></div>
                  <div class="item-meta">
                    <span class="badge">📥 <?= number_format($item['downloads'], 0, ',', ' ') ?> downloads</span>
                  </div>
                </li>
              <?php endforeach; ?>
            </ul>
          <?php endif; ?>
        </section>

        <!-- New Articles -->
        <section class="section-card">
          <h2>🆕 New Articles</h2>
          <?php if (empty($new)): ?>
            <p class="empty-state">No new articles at the moment</p>
          <?php else: ?>
            <ul class="items-list">
              <?php foreach ($new as $item): ?>
                <li class="item">
                  <div class="item-title"><?= htmlspecialchars($item['title']) ?></div>
                  <div class="item-meta">
                    <span class="date">📅 <?= date('M d, Y', strtotime($item['created_at'])) ?></span>
                  </div>
                </li>
              <?php endforeach; ?>
            </ul>
          <?php endif; ?>
        </section>

        <!-- Authors -->
        <section class="section-card">
          <h2>👥 Authors</h2>
          <?php if (empty($authors)): ?>
            <p class="empty-state">No authors available</p>
          <?php else: ?>
            <div class="authors-grid">
              <?php foreach ($authors as $author): ?>
                <div class="author-card">
                  <div class="author-name"><?= htmlspecialchars($author['name']) ?></div>
                </div>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </section>
      </div>
    <?php endif; ?>

    <!-- Search Form -->
    <section class="search-section">
      <h2>🔍 Search</h2>
      <form method="GET" action="/" class="search-form">
        <div class="form-row">
          <div class="form-group">
            <label for="topic">Topic</label>
            <select name="topic" id="topic">
              <option value="">All topics</option>
              <?php foreach ($topics as $topic): ?>
                <option value="<?= $topic['id'] ?>" <?= (isset($_GET['topic']) && $_GET['topic'] == $topic['id']) ? 'selected' : '' ?>>
                  <?= htmlspecialchars($topic['name']) ?>
                </option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label for="author">Author</label>
            <select name="author" id="author">
              <option value="">All authors</option>
              <?php foreach ($authors as $author): ?>
                <option value="<?= $author['id'] ?>" <?= (isset($_GET['author']) && $_GET['author'] == $author['id']) ? 'selected' : '' ?>>
                  <?= htmlspecialchars($author['name']) ?>
                </option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label for="keyword">Keyword</label>
            <input type="text" name="keyword" id="keyword" placeholder="Search for an article..." value="<?= isset($_GET['keyword']) ? htmlspecialchars($_GET['keyword']) : '' ?>">
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="submit" class="btn-search">🔍 Search</button>
          <?php if ($hasSearch): ?>
            <a href="/" class="btn-clear">✖️ Clear</a>
          <?php endif; ?>
        </div>
      </form>
    </section>
  </div>
</body>
</html>
