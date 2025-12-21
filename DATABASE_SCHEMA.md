# Database Schema for Authentication System

This document describes the database tables created for the authentication system in the Next.js chat application.

## Tables

### 1. `users` Table

Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE NOT NULL | User's email address (used for login) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `name` | VARCHAR(255) | NOT NULL | User's full name |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last account update timestamp |

**Indexes:**
- `idx_users_email` on `email` - Optimizes login queries

**Sample Query:**
```sql
-- Create a new user
INSERT INTO users (email, password_hash, name, created_at, updated_at)
VALUES ('user@example.com', '$2a$10$...', 'John Doe', NOW(), NOW())
RETURNING id, email, name, created_at, updated_at;

-- Find user by email
SELECT id, email, password_hash, name, created_at, updated_at 
FROM users 
WHERE email = 'user@example.com';
```

---

### 2. `sessions` Table

Manages user authentication sessions (currently used for potential future session tracking, JWT tokens are stored in HTTP-only cookies).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique session identifier |
| `user_id` | INTEGER | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | Reference to user |
| `token` | TEXT | NOT NULL | Session token |
| `expires_at` | TIMESTAMP | NOT NULL | Session expiration time |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Session creation timestamp |

**Indexes:**
- `idx_sessions_token` on `token` - Fast token lookup
- `idx_sessions_user_id` on `user_id` - Find all sessions for a user
- `idx_sessions_expires_at` on `expires_at` - Cleanup expired sessions

**Sample Query:**
```sql
-- Create a session
INSERT INTO sessions (user_id, token, expires_at, created_at)
VALUES (1, 'jwt-token-here', NOW() + INTERVAL '7 days', NOW());

-- Find active session
SELECT * FROM sessions 
WHERE token = 'jwt-token-here' 
AND expires_at > NOW();

-- Clean up expired sessions
DELETE FROM sessions WHERE expires_at < NOW();
```

---

### 3. `conversations` Table

Stores chat conversation sessions for each user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique conversation identifier |
| `user_id` | INTEGER | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | Owner of the conversation |
| `title` | VARCHAR(255) | NOT NULL, DEFAULT 'New Conversation' | Conversation title (auto-generated) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Conversation creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last message timestamp |

**Indexes:**
- `idx_conversations_user_id` on `user_id` - Find all conversations for a user
- `idx_conversations_updated_at` on `updated_at DESC` - Sort by recent activity

**Sample Query:**
```sql
-- Get all conversations for a user
SELECT c.id, c.title, c.created_at, c.updated_at, COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.user_id = 1
GROUP BY c.id
ORDER BY c.updated_at DESC;

-- Create a new conversation
INSERT INTO conversations (user_id, title, created_at, updated_at)
VALUES (1, 'New Conversation', NOW(), NOW())
RETURNING id, user_id, title, created_at, updated_at;
```

---

### 4. `messages` Table

Stores individual messages within conversations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique message identifier |
| `conversation_id` | INTEGER | NOT NULL, FOREIGN KEY → conversations(id) ON DELETE CASCADE | Parent conversation |
| `role` | VARCHAR(20) | NOT NULL, CHECK (role IN ('user', 'assistant')) | Message sender role |
| `content` | TEXT | NOT NULL | Message text content |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Message timestamp |

**Indexes:**
- `idx_messages_conversation_id` on `conversation_id` - Get all messages in a conversation
- `idx_messages_created_at` on `created_at` - Sort messages chronologically

**Sample Query:**
```sql
-- Get all messages in a conversation
SELECT id, role, content, created_at
FROM messages
WHERE conversation_id = 1
ORDER BY created_at ASC;

-- Add a new message
INSERT INTO messages (conversation_id, role, content, created_at)
VALUES (1, 'user', 'Hello, how are you?', NOW())
RETURNING id, conversation_id, role, content, created_at;
```

---

## Existing Tables (for reference)

### 5. `purchase_embeddings` Table
Stores vector embeddings for purchase data (pre-existing).

### 6. `query_logs` Table
Stores analytics for search queries (pre-existing).


---

## Database Initialization

The database tables are automatically created when the application starts via the `initDB()` function in `src/lib/db.ts`.

To manually initialize or reset the database:

```typescript
import { initDB } from '@/lib/db';

// Initialize database
await initDB();
```

---

## Security Notes

1. **Passwords**: Never stored in plain text. Always hashed using bcrypt with 10 salt rounds.
2. **Email**: Stored in lowercase for case-insensitive login.
3. **Sessions**: JWT tokens are stored in HTTP-only cookies to prevent XSS attacks.
4. **Foreign Keys**: CASCADE delete ensures sessions are removed when a user is deleted.

---

## Migration Notes

If you need to add these tables to an existing database, they will be created automatically on the next application start. The `CREATE TABLE IF NOT EXISTS` syntax ensures no errors if tables already exist.

To manually verify tables exist:

```sql
-- Check if users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'users'
);

-- View table structure
\d users
\d sessions
```
