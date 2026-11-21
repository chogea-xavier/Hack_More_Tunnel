import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("ctf.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unique_id TEXT UNIQUE,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'student',
    level INTEGER DEFAULT 1,
    gold_points INTEGER DEFAULT 0,
    silver_points INTEGER DEFAULT 0,
    bronze_points INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    category TEXT,
    points INTEGER,
    flag TEXT,
    difficulty TEXT,
    level INTEGER, -- 1-10
    hints TEXT,
    prerequisite_id INTEGER,
    FOREIGN KEY(prerequisite_id) REFERENCES challenges(id)
  );

  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    category TEXT,
    level INTEGER,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT,
    level_range TEXT, -- e.g., 'Beginner (1-3)'
    certificate_code TEXT UNIQUE,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    challenge_id INTEGER,
    correct INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(challenge_id) REFERENCES challenges(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- NULL for global announcements
    title TEXT,
    message TEXT,
    type TEXT, -- 'challenge', 'level_up', 'announcement'
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add missing columns if they don't exist
const tables = ['users', 'challenges'];
tables.forEach(table => {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  const columnNames = columns.map(c => c.name);
  
  if (table === 'users') {
    if (!columnNames.includes('level')) db.prepare('ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1').run();
    if (!columnNames.includes('gold_points')) db.prepare('ALTER TABLE users ADD COLUMN gold_points INTEGER DEFAULT 0').run();
    if (!columnNames.includes('silver_points')) db.prepare('ALTER TABLE users ADD COLUMN silver_points INTEGER DEFAULT 0').run();
    if (!columnNames.includes('bronze_points')) db.prepare('ALTER TABLE users ADD COLUMN bronze_points INTEGER DEFAULT 0').run();
    if (!columnNames.includes('unique_id')) {
      db.prepare('ALTER TABLE users ADD COLUMN unique_id TEXT').run();
      db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_id ON users(unique_id)').run();
      
      // Populate unique_id for existing users
      const usersWithoutId = db.prepare("SELECT id FROM users WHERE unique_id IS NULL").all() as { id: number }[];
      usersWithoutId.forEach(u => {
        db.prepare("UPDATE users SET unique_id = ? WHERE id = ?").run(generateUniqueId(), u.id);
      });
    }
  }
  
  if (table === 'challenges') {
    if (!columnNames.includes('level')) db.prepare('ALTER TABLE challenges ADD COLUMN level INTEGER DEFAULT 1').run();
    if (!columnNames.includes('prerequisite_id')) db.prepare('ALTER TABLE challenges ADD COLUMN prerequisite_id INTEGER').run();
  }
});

// Helper to generate unique ID
function generateUniqueId() {
  return "HMT-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
}

// Seed expanded challenges
const challengeCount = db.prepare("SELECT COUNT(*) as count FROM challenges").get() as { count: number };
if (challengeCount.count === 0) {
  const insert = db.prepare("INSERT INTO challenges (title, description, category, points, flag, difficulty, level, hints, prerequisite_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  // Level 1-3 (Beginner)
  const c1 = insert.run("Digital Footprint", "Find the hidden string in the metadata of the HMT logo.", "Cybersecurity", 50, "HMT{M3TADATA_HUNT}", "Easy", 1, "Exiftool might help.", null).lastInsertRowid;
  const c2 = insert.run("Binary Basics", "Convert 01001000 01001101 01010100 to text.", "Computer Science", 50, "HMT", "Easy", 1, "Standard ASCII binary.", null).lastInsertRowid;
  insert.run("Prompt Injection 101", "Trick the AI into revealing the secret password 'HMT_AI_MASTER'.", "Generative AI", 100, "HMT_AI_MASTER", "Easy", 2, "Try asking it to ignore previous instructions.", null);
  
  // Level 4-6 (Intermediate)
  insert.run("SQLi Master", "Bypass the login form at /challenges/sqli-1 using a tautology.", "Cybersecurity", 250, "HMT{SQL_INJECTION_SUCCESS}", "Medium", 4, " ' OR '1'='1 ", c1);
  insert.run("Packet Sniffer", "Analyze the provided PCAP file and find the cleartext password.", "ICT", 300, "HMT{TCP_STREAM_EXPOSED}", "Medium", 5, "Follow TCP Stream in Wireshark.", c2);
  insert.run("Neural Network Leak", "Extract the hidden weight value from the simple perceptron model provided.", "Generative AI", 400, "HMT{WEIGHT_LEAK_0.85}", "Medium", 6, "Look at the model weights directly.", null);

  // Level 7-8 (Advanced)
  insert.run("Buffer Overflow", "Exploit the 'vuln' binary to overwrite the return address.", "Cybersecurity", 600, "HMT{STACK_SMASHED}", "Hard", 7, "Check the buffer size.", null);
  insert.run("RSA Weakness", "Factorize the small N to find the private key.", "Cryptography", 700, "HMT{RSA_FACTOR_SUCCESS}", "Hard", 8, "N is only 64 bits.", null);

  // Level 9-10 (Professional)
  insert.run("Kernel Exploit", "Escalate privileges to root on the provided VM.", "Cybersecurity", 1000, "HMT{ROOT_ACCESS_GRANTED}", "Professional", 9, "Check for outdated kernel versions.", null);
  insert.run("AI Model Inversion", "Reconstruct the training data sample from the model's gradients.", "Generative AI", 1200, "HMT{GRADIENT_INVERSION_MASTER}", "Professional", 10, "Deep learning expertise required.", null);
}

async function startServer() {
  const app = express();
  const server = createHttpServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // WebSocket for Scoreboard
  wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket");
    
    // Send initial scoreboard
    const scoreboard = getScoreboard();
    ws.send(JSON.stringify({ type: "SCOREBOARD_UPDATE", data: scoreboard }));
  });

  function getScoreboard() {
    return db.prepare(`
      SELECT u.username, u.unique_id, u.level, u.gold_points, u.silver_points, u.bronze_points
      FROM users u
      ORDER BY (u.gold_points * 100 + u.silver_points * 10 + u.bronze_points) DESC
      LIMIT 50
    `).all();
  }

  function broadcastScoreboard() {
    const scoreboard = getScoreboard();
    const message = JSON.stringify({ type: "SCOREBOARD_UPDATE", data: scoreboard });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  function sendNotification(userId: number | null, title: string, message: string, type: string) {
    console.log(`[EMAIL MOCK] To: ${userId ? 'User ' + userId : 'ALL'}, Subject: ${title}, Body: ${message}`);
    db.prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)").run(userId, title, message, type);
    
    // Broadcast notification via WS if needed
    const wsMessage = JSON.stringify({ type: "NOTIFICATION", data: { title, message, type } });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(wsMessage);
      }
    });
  }

  // API Routes
  app.post("/api/auth/register", (req, res) => {
    const { username, password, role } = req.body;
    const unique_id = generateUniqueId();
    const userRole = role === 'admin' ? 'admin' : 'student'; // In a real app, this would be protected
    try {
      const info = db.prepare("INSERT INTO users (username, password, unique_id, role) VALUES (?, ?, ?, ?)").run(username, password, unique_id, userRole);
      res.json({ id: info.lastInsertRowid, username, unique_id, role: userRole, level: 1, gold_points: 0, silver_points: 0, bronze_points: 0 });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      res.json({ 
        id: user.id, 
        username: user.username, 
        unique_id: user.unique_id, 
        role: user.role, 
        level: user.level,
        gold_points: user.gold_points,
        silver_points: user.silver_points,
        bronze_points: user.bronze_points
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/challenges", (req, res) => {
    const userId = req.query.userId;
    let challenges;
    
    if (userId) {
      // Fetch challenges and mark if they are unlocked
      challenges = db.prepare(`
        SELECT c.id, c.title, c.description, c.category, c.points, c.difficulty, c.level, c.hints, c.prerequisite_id,
        CASE 
          WHEN c.prerequisite_id IS NULL THEN 1
          WHEN EXISTS (SELECT 1 FROM submissions s WHERE s.user_id = ? AND s.challenge_id = c.prerequisite_id AND s.correct = 1) THEN 1
          ELSE 0
        END as unlocked,
        CASE
          WHEN EXISTS (SELECT 1 FROM submissions s WHERE s.user_id = ? AND s.challenge_id = c.id AND s.correct = 1) THEN 1
          ELSE 0
        END as solved
        FROM challenges c
      `).all(userId, userId);
    } else {
      challenges = db.prepare("SELECT id, title, description, category, points, difficulty, level, hints, prerequisite_id, 1 as unlocked, 0 as solved FROM challenges").all();
    }
    res.json(challenges);
  });

  app.post("/api/challenges/submit", (req, res) => {
    const { userId, challengeId, flag } = req.body;
    const challenge = db.prepare("SELECT * FROM challenges WHERE id = ?").get(challengeId) as any;
    
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });

    const alreadySolved = db.prepare("SELECT * FROM submissions WHERE user_id = ? AND challenge_id = ? AND correct = 1").get(userId, challengeId);
    if (alreadySolved) return res.json({ correct: true, message: "Already solved!" });

    const isCorrect = challenge.flag === flag;
    db.prepare("INSERT INTO submissions (user_id, challenge_id, correct) VALUES (?, ?, ?)").run(userId, challengeId, isCorrect ? 1 : 0);

    if (isCorrect) {
      // Reward points
      let pointsType = 'bronze_points';
      if (challenge.level >= 7) pointsType = 'gold_points';
      else if (challenge.level >= 4) pointsType = 'silver_points';
      
      db.prepare(`UPDATE users SET ${pointsType} = ${pointsType} + ? WHERE id = ?`).run(challenge.points, userId);

      // Check for level up
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
      const solvedCount = db.prepare("SELECT COUNT(*) as count FROM submissions WHERE user_id = ? AND correct = 1").get(userId) as { count: number };
      
      // Simple level progression: 1 level per 2 solved challenges
      const newLevel = Math.min(10, Math.floor(solvedCount.count / 2) + 1);
      if (newLevel > user.level) {
        db.prepare("UPDATE users SET level = ? WHERE id = ?").run(newLevel, userId);
        
        sendNotification(userId, "Level Up!", `Congratulations! You've reached Level ${newLevel}.`, "level_up");

        // Issue Badge
        db.prepare("INSERT INTO badges (user_id, name, category, level) VALUES (?, ?, ?, ?)").run(
          userId, 
          `Level ${newLevel} Achieved`, 
          challenge.category, 
          newLevel
        );

        // Issue Certificate for milestones
        if (newLevel === 3 || newLevel === 6 || newLevel === 8 || newLevel === 10) {
          const range = newLevel <= 3 ? 'Beginner' : newLevel <= 6 ? 'Intermediate' : newLevel <= 8 ? 'Advanced' : 'Professional';
          const certCode = "CERT-" + Math.random().toString(36).substring(2, 10).toUpperCase();
          db.prepare("INSERT INTO certificates (user_id, category, level_range, certificate_code) VALUES (?, ?, ?, ?)").run(
            userId,
            'General Mastery',
            range,
            certCode
          );
        }
      }

      broadcastScoreboard();
    }

    res.json({ correct: isCorrect });
  });

  app.get("/api/user/achievements/:userId", (req, res) => {
    const { userId } = req.params;
    const badges = db.prepare("SELECT * FROM badges WHERE user_id = ?").all();
    const certificates = db.prepare("SELECT * FROM certificates WHERE user_id = ?").all();
    const user = db.prepare("SELECT level, gold_points, silver_points, bronze_points FROM users WHERE id = ?").get(userId);
    const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC").all(userId);
    
    // Get struggles for AI Mentor
    const struggles = db.prepare(`
      SELECT c.title, COUNT(s.id) as failed_attempts
      FROM submissions s
      JOIN challenges c ON s.challenge_id = c.id
      WHERE s.user_id = ? AND s.correct = 0
      GROUP BY s.challenge_id
      HAVING failed_attempts >= 3
    `).all(userId);

    res.json({ badges, certificates, user, notifications, struggles });
  });

  // Admin Routes
  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT id, username, unique_id, role, level FROM users").all();
    res.json(users);
  });

  app.post("/api/admin/challenges", (req, res) => {
    const { title, description, category, points, flag, difficulty, level, hints, prerequisite_id } = req.body;
    const info = db.prepare(`
      INSERT INTO challenges (title, description, category, points, flag, difficulty, level, hints, prerequisite_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, category, points, flag, difficulty, level, hints, prerequisite_id);
    
    sendNotification(null, "New Challenge!", `A new challenge '${title}' has been released in ${category}.`, "challenge");
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/admin/announcements", (req, res) => {
    const { title, message } = req.body;
    sendNotification(null, title, message, "announcement");
    res.json({ success: true });
  });

  app.get("/api/scoreboard", (req, res) => {
    res.json(getScoreboard());
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
