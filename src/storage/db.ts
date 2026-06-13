import Dexie from "dexie";

export const db = new Dexie("MemoryCapsule");

db.version(1).stores({
  messages: "++id, role"
});