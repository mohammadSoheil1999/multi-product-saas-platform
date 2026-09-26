import "dotenv/config";
import {readFile} from "node:fs/promises";
import pg from "pg";

const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try{
  const sql=await readFile(new URL("../prisma/migrations/20260815000000_init/migration.sql",import.meta.url),"utf8");
  await client.query(sql);
  console.log("OpenDelivery local migration applied");
}finally{await client.end()}
