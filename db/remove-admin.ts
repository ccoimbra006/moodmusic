import "dotenv/config";
import Database from "better-sqlite3";

const dbPath = "./moodtrack.db";
const db = new Database(dbPath);

// Listar todos os admins
const admins = db
  .prepare("SELECT id, name, email, role FROM users WHERE role = 'admin'")
  .all() as Array<{ id: number; name: string | null; email: string | null; role: string }>;

console.log("\n=== Admins atuais ===");
if (admins.length === 0) {
  console.log("Nenhum admin encontrado.");
} else {
  for (const u of admins) {
    console.log(`ID: ${u.id} | Nome: ${u.name || "N/A"} | Email: ${u.email || "N/A"} | Role: ${u.role}`);
  }
}

// Remover admin do primeiro (ou escolhe pelo ID)
if (admins.length > 0) {
  const targetId = admins[0].id;
  db.prepare("UPDATE users SET role = 'user' WHERE id = ?").run(targetId);
  console.log(`\n✅ Admin ID ${targetId} removido — agora é USER normal.`);
} else {
  console.log("\nNada para remover.");
}

db.close();
