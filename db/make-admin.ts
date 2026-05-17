import Database from "better-sqlite3";

const dbPath = "./moodtrack.db";
const db = new Database(dbPath);

// Listar todos os utilizadores
const users = db.prepare("SELECT id, name, email, role FROM users").all() as Array<{ id: number; name: string | null; email: string | null; role: string }>;
console.log("\n=== Utilizadores ===");
for (const u of users) {
  console.log(`ID: ${u.id} | Nome: ${u.name || "N/A"} | Email: ${u.email || "N/A"} | Role: ${u.role}`);
}

// Promover o primeiro utilizador a admin (ou escolhe pelo ID)
if (users.length > 0) {
  const targetId = users[0].id;
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run("admin", targetId);
  console.log(`\n✅ Utilizador ID ${targetId} promovido a ADMIN!`);
} else {
  console.log("\n❌ Nenhum utilizador encontrado. Faz login primeiro.");
}

db.close();
