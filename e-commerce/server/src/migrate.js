import"dotenv/config";import{readdir,readFile}from"node:fs/promises";import{pool}from"./db.js";
const directory=new URL("../migrations/",import.meta.url);
for(const file of(await readdir(directory)).filter(x=>x.endsWith(".sql")).sort()){
 const sql=await readFile(new URL(file,directory),"utf8");
 await pool.query(sql);
 console.log(`Applied ${file}`);
}
await pool.end();console.log("E-Commerce migrations applied");
