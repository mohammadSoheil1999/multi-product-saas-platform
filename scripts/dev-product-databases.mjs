import {PGlite} from "../company-website/node_modules/@electric-sql/pglite/dist/index.js";
import {PGLiteSocketServer} from "../company-website/node_modules/@electric-sql/pglite-socket/dist/index.js";

const databases=[
  {name:"opendelivery",port:5432,path:"openDelivery/.pglite/opendelivery"},
  {name:"ecommerce",port:5435,path:"e-commerce/server/.pglite/ecommerce"},
  {name:"realestate",port:5436,path:"realEstate/server/.pglite/realestate"},
];
const servers=[];
for(const item of databases){
  const database=await PGlite.create(item.path);
  const server=new PGLiteSocketServer({db:database,host:"127.0.0.1",port:item.port,maxConnections:20});
  await server.start();
  servers.push({server,database});
  console.log(`${item.name} database ready on 127.0.0.1:${item.port}`);
}
async function close(){for(const {server,database} of servers.reverse()){await server.stop();await database.close()}process.exit(0)}
process.on("SIGINT",close);process.on("SIGTERM",close);
await new Promise(()=>{});
