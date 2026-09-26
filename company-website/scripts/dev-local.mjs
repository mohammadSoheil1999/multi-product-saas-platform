import { spawn } from "node:child_process";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const database=await PGlite.create(".pglite/company");
const server=new PGLiteSocketServer({db:database,host:"127.0.0.1",port:5434,maxConnections:10});
await server.start();
console.log("Local company database ready on 127.0.0.1:5434");

function run(command,args){return new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:"inherit",env:process.env});child.once("error",reject);child.once("exit",code=>code===0?resolve():reject(new Error(`${command} exited with ${code}`)))})}
await run(process.execPath,["scripts/local-migrate.mjs"]);
const next=spawn(process.execPath,["node_modules/next/dist/bin/next","dev"],{stdio:"inherit",env:process.env});
const shutdown=async()=>{next.kill("SIGTERM");await server.stop();await database.close();process.exit(0)};
process.on("SIGINT",shutdown);process.on("SIGTERM",shutdown);
next.once("exit",async code=>{await server.stop();await database.close();process.exit(code??0)});
