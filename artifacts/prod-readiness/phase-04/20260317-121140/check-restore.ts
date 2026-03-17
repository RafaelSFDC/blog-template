import Database from "better-sqlite3";

const db = new Database(process.argv[2], { readonly: true });
const wanted = ["posts", "pages", "media", "comments", "subscriptions", "newsletter_deliveries", "__lumina_migrations", "contact_messages"];
const tables = db.prepare("select name from sqlite_master where type = 'table'").all() as { name: string }[];
const tableSet = new Set(tables.map((t) => t.name));
const counts: Record<string, number | null> = {};
for (const table of wanted) {
  if (!tableSet.has(table)) {
    counts[table] = null;
    continue;
  }
  const row = db.prepare(`select count(*) as c from ${table}`).get() as { c: number };
  counts[table] = row.c;
}
console.log(JSON.stringify({ counts, availableTables: tables.map((t) => t.name).sort() }, null, 2));
