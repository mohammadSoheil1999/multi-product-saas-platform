import "dotenv/config";
import { readdir,readFile } from "node:fs/promises";
import { Client } from "pg";
const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect();
await client.query('CREATE TABLE IF NOT EXISTS "_local_migrations" (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
for(const name of (await readdir("prisma/migrations",{withFileTypes:true})).filter(x=>x.isDirectory()).map(x=>x.name).sort()){
 if((await client.query('SELECT 1 FROM "_local_migrations" WHERE name=$1',[name])).rowCount)continue;
 const applied=name.includes("init")?(await client.query(`SELECT to_regclass('public."User"') AS found`)).rows[0].found:name.includes("product_provisioning")?(await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name='Product' AND column_name='productionUrl'`)).rowCount:false;
 if(!applied){const sql=await readFile(`prisma/migrations/${name}/migration.sql`,"utf8");await client.query("BEGIN");try{await client.query(sql);await client.query('INSERT INTO "_local_migrations" (name) VALUES ($1)',[name]);await client.query("COMMIT")}catch(error){await client.query("ROLLBACK");throw error}}
 else await client.query('INSERT INTO "_local_migrations" (name) VALUES ($1)',[name]);
 console.log(`Local migration ready: ${name}`);
}
await client.end();
