

## Project Overview

CopyForward (CFP) is a web-based research repository system that allows authors to share academic work (theses, articles, datasets, etc.) while supporting children's charities through donations. The system includes plagiarism committee voting, item approval workflows, and user roles (Regular, Author, Moderator).

## Architecture

### Technology Stack
- **Backend**: PHP 7.4 (configurable in `.env`)
- **Frontend**: React 19 with Vite
- **Database**: MySQL 8.0 (configurable to MariaDB or MySQL 5.7)
- **Infrastructure**: Docker Compose with LAMP stack
- **Services**: Apache webserver, MySQL/MariaDB, phpMyAdmin, Redis

### Key Components

#### Backend (PHP in `www/`)
- **Database Connection**: `db.php` - Database connection via MySQLi (uses environment variables)
- **Authentication**: `login.php`, `signup.php`, `logout.php` - Session-based auth with password hashing
- **API Endpoints**: Individual PHP files serve as REST-like endpoints (e.g., `items.php`, `members.php`, `donations.php`)
- **Database**: `ovc353_2` database with tables for Members, Items, Comments, Downloads, Donations, Committees, Discussions, etc.

#### Frontend (React in `react/lamp-react/`)
- **Build Output**: Vite builds to `www/` directory
- **Routing**: Hash-based routing in `App.jsx` (e.g., `#/items/123`, `#/authors`)
- **State Management**: useState/useEffect hooks, localStorage for auth state
- **API Communication**: Direct fetch calls to PHP endpoints (no centralized API client)

#### Database Architecture
- **Member System**: Roles (Regular/Author/Moderator), ORCID support, blacklisting
- **Item Workflow**: Upload → Under Review → Approved/Removed
- **Committee System**: Plagiarism Committee (ID=1) and Appeal Committee (ID=2)
- **Discussion & Voting**: Committee members vote on plagiarism reports and appeals
- **Automated Processing**: MySQL Events run every minute to process voting deadlines
  - `process_due_plagiarism_vote()`: Handles plagiarism votes (2/3 majority removes item, 3+ removals blacklists author)
  - `process_due_appeal_vote()`: Handles appeal votes (>50% majority reinstates item)

## Development Commands

### Docker Container Management
```powershell
# Start all services (webserver, database, phpMyAdmin, Redis)
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild containers (after .env changes)
docker-compose up -d --build --force-recreate

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f webserver
docker-compose logs -f database
```

### React Frontend

**Working directory**: `react/lamp-react/`

```powershell
# Install dependencies
npm install

# Development server (runs on Vite's default port, typically 5173)
npm run dev

# Build for production (outputs to www/)
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Database Management

**Access phpMyAdmin**: `http://localhost:8080` (port configurable in `.env`)
- Username: `root` or `docker`
- Password: See `.env` (`MYSQL_ROOT_PASSWORD` or `MYSQL_PASSWORD`)

**Import database schema**:
```powershell
# Copy SQL file into container and import
docker cp database_new.sql lamp-database:/tmp/database_new.sql
docker exec -i lamp-database mysql -uroot -ptiger ovc353_2 < database_new.sql

# Or via phpMyAdmin Import tab
```

**Run SQL from command line**:
```powershell
docker exec -it lamp-database mysql -uroot -ptiger ovc353_2
```

### Access Points

- **Main Application**: `http://localhost` (or configured `HOST_MACHINE_UNSECURE_HOST_PORT`)
- **React Frontend**: `http://localhost/react/`
- **phpMyAdmin**: `http://localhost:8080`
- **Test Pages**: `http://localhost/test_db.php`, `http://localhost/phpinfo.php`

## Development Workflow Patterns

### Adding New PHP Endpoints
1. Create new PHP file in `www/` directory
2. Include `db.php` for database connection: `require __DIR__ . '/db.php';`
3. Use prepared statements with MySQLi: `$mysqli->prepare()`
4. Return JSON responses: `echo json_encode(['success' => true, 'data' => $result]);`
5. Set proper headers: `header('Content-Type: application/json');`

### Adding React Pages
1. Create component in `react/lamp-react/src/pages/`
2. Add route matching in `App.jsx` (hash-based routing)
3. Use fetch to call PHP endpoints: `await fetch('/endpoint.php')`
4. Build and deploy: `npm run build` (outputs to `www/`)

### Database Schema Changes
1. Modify `database_new.sql` with new tables/columns
2. For existing data, create migration scripts in `config/initdb/` (runs on container init)
3. Test locally before deploying
4. Consider impact on stored procedures and events

### Authentication Flow
- Login stores member ID in `localStorage` as `logged_in_id`
- PHP sessions store `member_id`, `role`, `email`
- Frontend checks `localStorage.getItem('logged_in_id')` for auth state
- Backend verifies session with `session_start()` and `$_SESSION['member_id']`

## Configuration

### Environment Variables (`.env`)

**PHP Version**: `PHPVERSION` (php74, php8, php81, php82, php83, php84)
**Database**: `DATABASE` (mysql8, mysql57, mariadb103-106)
**Ports**:
- `HOST_MACHINE_UNSECURE_HOST_PORT` (default: 80)
- `HOST_MACHINE_MYSQL_PORT` (default: 3306)
- `HOST_MACHINE_PMA_PORT` (default: 8080)

**Database Credentials**:
- `MYSQL_HOST` (local: database, AITS: ovc353.encs.concordia.ca)
- `MYSQL_USER` (local: docker, AITS: ovc353_2)
- `MYSQL_PASSWORD` (local: docker, AITS: darkjade89)
- `MYSQL_ROOT_PASSWORD` (local: tiger)
- `MYSQL_DATABASE` (local & AITS: ovc353_2 )
- `MYSQL_PORT` (local & AITS: 3306 )

**Note**: The application uses database name `ovc353_2` locally, as well as on AITS

## Important Architectural Notes

### Session & State Management
- Backend uses PHP sessions (`$_SESSION`)
- Frontend stores auth in localStorage (`logged_in_id`)
- No JWT or token-based auth - relies on session cookies

### Item Status Workflow
1. **Under Review (Upload)**: Newly uploaded items awaiting moderator approval
2. **Available**: Approved and publicly accessible
3. **Under Review (Plagiarism)**: Flagged for plagiarism review
4. **Removed**: Committee voted to remove (can be appealed)
5. **Deleted (Author)**: Author deleted their own item

### Committee Voting System
- **Plagiarism Committee** (ID=1): 2/3 majority required to remove items
- **Appeal Committee** (ID=2): >50% majority required to reinstate items
- Automated processing via MySQL Events every minute
- Authors automatically blacklisted after 3 removed items

### Download Restrictions
- Members can download one item per 7-day window (enforced in `can_download.php`)
- Download tracking in `Download` table

### Donation Distribution
- Minimum 60% to children's charity
- Remaining split between author and CFP
- Constraint: `AuthorPercent + ChildrenCharityPercent + CFPPercent = 100`

## File Organization

```
CopyForward-Web-System/
├── bin/                    # Docker build contexts for PHP/DB versions
├── config/
│   ├── initdb/            # Database initialization scripts
│   ├── php/php.ini        # PHP configuration
│   ├── ssl/               # SSL certificates
│   └── vhosts/            # Apache virtual hosts
├── data/mysql/            # MySQL data directory (persisted)
├── logs/                  # Apache, MySQL, Xdebug logs
├── react/lamp-react/      # React frontend source
│   ├── src/
│   │   ├── pages/         # React page components
│   │   ├── App.jsx        # Main app with routing
│   │   └── Header.jsx     # Navigation header
│   ├── package.json
│   └── vite.config.js     # Removes old files and builds new static files to www/
├── www/                   # PHP backend & built frontend
│   ├── assets/            # Static assets (CSS, images)
│   ├── react/             # Unused/deprecated
│   ├── index-<hash>.js    # JavaScript Static build file
│   ├── index-<hash>.css   # CSS Static build file
│   ├── index.html         # Main HTML Static build file
│   ├── db.php             # Database connection
│   ├── login.php          # Authentication endpoint
│   ├── items.php          # Item listing/search
│   ├── item.php           # Individual item details
│   ├── members.php        # Member management
│   └── [other endpoints]
├── .env                   # Environment configuration
├── database_new.sql       # Complete database schema
├── docker-compose.yml     # Service definitions
└── seed.sql               # Sample data
└── README.md              # This documentation file
```

## Testing

No automated test framework is configured. Manual testing workflow:
1. Test backend endpoints via browser or curl
2. Check phpMyAdmin for data integrity
3. Test React frontend via browser
4. Verify logs in `logs/` directory for errors

## Common Issues

### Port Conflicts
If ports 80, 443, 3306, or 8080 are in use, modify `.env` port variables and restart containers.

### Database Connection Errors
- Ensure database container is running: `docker-compose ps`
- Check credentials in `.env` match `db.php`
- Database name is hardcoded as `ovc353_2` in `db.php`

### React Build Not Showing
- Run `npm run build` in `react/lamp-react/`
- Verify output in `www/`
- Clear browser cache

### MySQL Events Not Running
Check event scheduler status:
```sql
SHOW VARIABLES LIKE 'event_scheduler';
SET GLOBAL event_scheduler = ON;
```
