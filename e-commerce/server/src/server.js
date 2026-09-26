import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import { pool } from "./db.js";

const app=express();
const origin=process.env.ALLOWED_ORIGIN||"";
const hash=value=>crypto.createHash("sha256").update(value).digest("hex");
const same=(a,b,encoding="hex")=>{const x=Buffer.from(a||"",encoding),y=Buffer.from(b||"",encoding);return x.length===y.length&&x.length>0&&crypto.timingSafeEqual(x,y)};
const cookies=req=>Object.fromEntries((req.headers.cookie||"").split(";").filter(Boolean).map(x=>x.trim().split("=").map(decodeURIComponent)));
const passwordHash=password=>{const salt=crypto.randomBytes(16).toString("hex");return`scrypt:${salt}:${crypto.scryptSync(password,salt,64).toString("hex")}`};
const passwordMatches=(password,stored)=>{const[,salt,digest]=String(stored||"").split(":");if(!salt||!digest)return false;return same(crypto.scryptSync(password,salt,64).toString("hex"),digest)};
const authAttempts=new Map();
function authRateLimit(req,res,next){const key=req.ip||"unknown",now=Date.now(),entry=authAttempts.get(key)||{count:0,reset:now+60000};if(entry.reset<now){entry.count=0;entry.reset=now+60000}entry.count++;authAttempts.set(key,entry);if(entry.count>20)return res.status(429).json({error:"Too many attempts"});next()}

app.disable("x-powered-by");
app.use((req,res,next)=>{
  res.setHeader("x-content-type-options","nosniff");
  res.setHeader("referrer-policy","strict-origin-when-cross-origin");
  res.setHeader("x-frame-options","DENY");
  res.setHeader("access-control-allow-origin",origin);
  res.setHeader("access-control-allow-credentials","true");
  res.setHeader("access-control-allow-headers","content-type,x-provisioning-signature,x-provisioning-timestamp");
  if(req.method==="OPTIONS")return res.sendStatus(204);
  next();
});
app.use(express.json({limit:"256kb",verify:(req,res,buf)=>{req.rawBody=buf.toString("utf8")}}));

async function tenant(req,res,next){
  const token=cookies(req).product_session;
  if(!token)return res.status(401).json({error:"Sign in from the company dashboard"});
  const q=await pool.query("select t.* from product_sessions s join tenants t on t.id=s.tenant_id where s.token_hash=$1 and s.expires_at>now() and t.status='ACTIVE'",[hash(token)]);
  if(!q.rowCount)return res.status(403).json({error:"Session unavailable"});
  req.tenant=q.rows[0];next();
}
async function customer(req,res,next){
  const token=cookies(req).customer_session;
  if(!token)return res.status(401).json({error:"Customer login required"});
  const q=await pool.query("select c.id,c.email,c.full_name,c.phone,c.status from customer_sessions s join customers c on c.id=s.customer_id and c.tenant_id=s.tenant_id where s.token_hash=$1 and s.tenant_id=$2 and s.expires_at>now() and c.status='ACTIVE'",[hash(token),req.tenant.id]);
  if(!q.rowCount)return res.status(401).json({error:"Customer session expired"});
  req.customer=q.rows[0];next();
}

app.get("/api/health",async(req,res)=>{
  try{await pool.query("select 1");res.json({ok:true,database:true,mode:process.env.APP_MODE||"demo",payments:false})}
  catch{res.status(503).json({ok:false,database:false})}
});

app.post("/api/platform/session",async(req,res)=>{
  try{
    if(process.env.APP_MODE==="demo")return res.status(403).json({error:"Demo mode"});
    const secret=process.env.PROVISIONING_SECRET||"",[body,signature]=String(req.body.handoff||"").split(".");
    if(secret.length<32||!body||!signature)return res.status(401).json({error:"Invalid handoff"});
    const expected=crypto.createHmac("sha256",secret).update(body).digest("base64url");
    if(!same(expected,signature,"base64url"))return res.status(401).json({error:"Invalid handoff"});
    const data=JSON.parse(Buffer.from(body,"base64url").toString());
    if(data.expiresAt<Date.now())return res.status(401).json({error:"Expired handoff"});
    const exists=await pool.query("select id from tenants where id=$1 and owner_email=$2 and status='ACTIVE'",[data.tenantId,data.email]);
    if(!exists.rowCount)return res.status(403).json({error:"Tenant unavailable"});
    const token=crypto.randomBytes(32).toString("base64url");
    await pool.query("insert into product_sessions(token_hash,tenant_id,user_id,email,expires_at) values($1,$2,$3,$4,now()+interval '12 hours')",[hash(token),data.tenantId,data.userId,data.email]);
    res.setHeader("set-cookie",`product_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200${process.env.NODE_ENV==="production"?"; Secure":""}`);
    res.json({ok:true});
  }catch{res.status(401).json({error:"Invalid handoff"})}
});

app.post("/api/platform/dev-session",async(req,res)=>{
  if(process.env.NODE_ENV==="production")return res.status(404).json({error:"Not found"});
  const tenantId=String(req.body.tenant||"").trim().toLowerCase();
  const result=await pool.query("select id,business_name from tenants where id=$1 and status='ACTIVE'",[tenantId]);
  if(!result.rowCount)return res.status(404).json({error:"Store not found"});
  const token=crypto.randomBytes(32).toString("base64url");
  await pool.query("insert into product_sessions(token_hash,tenant_id,user_id,email,expires_at) values($1,$2,$3,$4,now()+interval '12 hours')",[hash(token),tenantId,`dev:${tenantId}`,`dev@${tenantId}.example.test`]);
  res.setHeader("set-cookie",`product_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200`);
  res.json({ok:true,businessName:result.rows[0].business_name});
});

app.post("/api/customer/register",authRateLimit,tenant,async(req,res)=>{
  const fullName=String(req.body.fullName||"").trim(),email=String(req.body.email||"").trim().toLowerCase(),phone=String(req.body.phone||"").trim(),password=String(req.body.password||"");
  if(fullName.length<2||fullName.length>100||!email.includes("@")||email.length>200||phone.length>30||password.length<10||password.length>128)return res.status(400).json({error:"Invalid registration details"});
  try{
    const q=await pool.query("insert into customers(tenant_id,email,full_name,phone,password_hash,email_verified) values($1,$2,$3,$4,$5,$6) returning id,email,full_name,phone",[req.tenant.id,email,fullName,phone,passwordHash(password),process.env.NODE_ENV!=="production"]);
    await pool.query("insert into commerce_audit_logs(tenant_id,actor,action,target_type,target_id) values($1,$2,'CUSTOMER_REGISTERED','Customer',$3)",[req.tenant.id,email,String(q.rows[0].id)]);
    res.status(201).json({customer:q.rows[0],verificationRequired:process.env.NODE_ENV==="production"});
  }catch(error){if(error.code==="23505")return res.status(409).json({error:"Email already registered"});throw error}
});
app.post("/api/customer/login",authRateLimit,tenant,async(req,res)=>{
  const email=String(req.body.email||"").trim().toLowerCase(),password=String(req.body.password||"");
  const q=await pool.query("select id,email,full_name,phone,password_hash,email_verified,status from customers where tenant_id=$1 and email=$2",[req.tenant.id,email]);
  const record=q.rows[0];
  if(!record||!passwordMatches(password,record.password_hash))return res.status(400).json({error:"Invalid email or password"});
  if(record.status!=="ACTIVE")return res.status(403).json({error:"Account suspended"});
  if(!record.email_verified)return res.status(403).json({error:"Verify your email first"});
  const token=crypto.randomBytes(32).toString("base64url");
  await pool.query("insert into customer_sessions(token_hash,tenant_id,customer_id,expires_at) values($1,$2,$3,now()+interval '30 days')",[hash(token),req.tenant.id,record.id]);
  await pool.query("update customers set last_login_at=now() where tenant_id=$1 and id=$2",[req.tenant.id,record.id]);
  res.setHeader("set-cookie",`customer_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${process.env.NODE_ENV==="production"?"; Secure":""}`);
  res.json({customer:{id:record.id,email:record.email,fullName:record.full_name,phone:record.phone}});
});
app.post("/api/customer/logout",tenant,async(req,res)=>{const token=cookies(req).customer_session;if(token)await pool.query("delete from customer_sessions where token_hash=$1 and tenant_id=$2",[hash(token),req.tenant.id]);res.setHeader("set-cookie","customer_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");res.json({ok:true})});
app.get("/api/customer/me",tenant,customer,(req,res)=>res.json({id:req.customer.id,email:req.customer.email,fullName:req.customer.full_name,phone:req.customer.phone}));
app.get("/api/customer/orders",tenant,customer,async(req,res)=>{const q=await pool.query("select o.*,coalesce(json_agg(oi order by oi.id) filter(where oi.id is not null),'[]') as order_items from orders o left join order_items oi on oi.order_id=o.id and oi.tenant_id=o.tenant_id where o.tenant_id=$1 and o.customer_id=$2 group by o.id order by o.created_at desc limit 100",[req.tenant.id,req.customer.id]);res.json(q.rows)});

app.post("/api/platform/provision",async(req,res)=>{
  try{
    if(process.env.APP_MODE==="demo")return res.status(403).json({error:"Demo deployments cannot be provisioned"});
    const secret=process.env.PROVISIONING_SECRET||"",ts=req.get("x-provisioning-timestamp")||"";
    if(secret.length<32)return res.status(503).json({error:"Provisioning is not configured"});
    if(Math.abs(Date.now()-Number(ts))>300000)return res.status(401).json({error:"Expired request"});
    const sig=crypto.createHmac("sha256",secret).update(`${ts}.${req.rawBody}`).digest("hex");
    if(!same(sig,req.get("x-provisioning-signature")))return res.status(401).json({error:"Invalid signature"});
    const b=req.body;
    if(b.productSlug!=="ecommerce"||!b.eventId||!b.subscriptionId||!b.customer?.email||!b.plan?.slug)return res.status(400).json({error:"Invalid payload"});
    const id=`shop_${hash(b.subscriptionId).slice(0,20)}`,status=b.action==="suspend"?"SUSPENDED":"ACTIVE",client=await pool.connect();
    try{
      await client.query("begin");
      const prior=await client.query("select tenant_id from provisioning_events where event_id=$1",[b.eventId]);
      if(!prior.rowCount){
        await client.query("insert into tenants(id,subscription_id,business_name,owner_email,plan_slug,plan_limits,status) values($1,$2,$3,$4,$5,$6,$7) on conflict(subscription_id) do update set business_name=excluded.business_name,owner_email=excluded.owner_email,plan_slug=excluded.plan_slug,plan_limits=excluded.plan_limits,status=excluded.status,updated_at=now()",[id,b.subscriptionId,b.business?.name||b.customer.name,b.customer.email,b.plan.slug,JSON.stringify(b.plan.limits||{}),status]);
        await client.query("insert into provisioning_events(event_id,tenant_id) values($1,$2)",[b.eventId,id]);
      }
      await client.query("commit");
    }catch(error){await client.query("rollback");throw error}finally{client.release()}
    res.json({externalTenantId:id,accessUrl:(process.env.PRODUCTION_APP_URL||"http://localhost:5174").replace(/\/$/,""),status:"ACTIVE"});
  }catch(error){console.error(error.message);res.status(500).json({error:"Provisioning failed"})}
});

app.get("/api/products",tenant,async(req,res)=>{const q=await pool.query("select id,name,sku,description,image_url as \"imageUrl\",price_minor as \"priceMinor\",currency,stock,active from products where tenant_id=$1 and active=true order by created_at desc",[req.tenant.id]);res.json(q.rows)});
app.post("/api/products",tenant,async(req,res)=>{const b=req.body,name=String(b.name||"").trim(),sku=String(b.sku||"").trim();if(name.length<2||!sku||!Number.isInteger(b.priceMinor)||b.priceMinor<0||!Number.isInteger(b.stock)||b.stock<0)return res.status(400).json({error:"Invalid product"});try{const q=await pool.query("insert into products(tenant_id,name,sku,description,image_url,price_minor,currency,stock,active) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",[req.tenant.id,name,sku,b.description||"",b.imageUrl||null,b.priceMinor,String(b.currency||"ILS").toUpperCase(),b.stock,b.active!==false]);res.status(201).json(q.rows[0])}catch(error){if(error.code==="23505")return res.status(409).json({error:"SKU already exists"});throw error}});
app.patch("/api/products/:id",tenant,async(req,res)=>{const b=req.body;if(!Number.isInteger(Number(req.params.id)))return res.status(400).json({error:"Invalid product"});const q=await pool.query("update products set name=coalesce($1,name),description=coalesce($2,description),image_url=coalesce($3,image_url),price_minor=coalesce($4,price_minor),stock=coalesce($5,stock),active=coalesce($6,active),updated_at=now() where tenant_id=$7 and id=$8 returning *",[b.name??null,b.description??null,b.imageUrl??null,Number.isInteger(b.priceMinor)&&b.priceMinor>=0?b.priceMinor:null,Number.isInteger(b.stock)&&b.stock>=0?b.stock:null,typeof b.active==="boolean"?b.active:null,req.tenant.id,req.params.id]);if(!q.rowCount)return res.status(404).json({error:"Product not found"});res.json(q.rows[0])});
app.get("/api/customers",tenant,async(req,res)=>{const q=await pool.query("select c.id,c.email,c.full_name,c.phone,c.status,c.created_at,count(o.id)::int as order_count from customers c left join orders o on o.customer_id=c.id and o.tenant_id=c.tenant_id where c.tenant_id=$1 group by c.id order by c.created_at",[req.tenant.id]);res.json(q.rows)});
app.get("/api/dashboard/summary",tenant,async(req,res)=>{const q=await pool.query("select (select count(*)::int from customers where tenant_id=$1) customers,(select count(*)::int from products where tenant_id=$1 and active=true) products,(select count(*)::int from orders where tenant_id=$1) orders,(select coalesce(sum(total_minor),0)::int from orders where tenant_id=$1) as revenue_minor",[req.tenant.id]);res.json(q.rows[0])});

app.post("/api/orders",tenant,async(req,res)=>{
  const b=req.body,email=String(b.customerEmail||"").trim().toLowerCase();
  if(!email.includes("@")||!Array.isArray(b.items)||!b.items.length||b.items.length>50)return res.status(400).json({error:"Invalid order"});
  const client=await pool.connect();
  try{
    await client.query("begin");
    const customer=await client.query("select id from customers where tenant_id=$1 and email=$2 and status='ACTIVE'",[req.tenant.id,email]);
    if(!customer.rowCount)throw new Error("CUSTOMER_REQUIRED");
    let total=0;const lines=[];
    for(const raw of b.items){
      const sku=String(raw.sku||raw.product?.sku||"").trim(),quantity=Number(raw.quantity||raw.qty);
      if(!sku||!Number.isInteger(quantity)||quantity<1||quantity>100)throw new Error("INVALID_ITEM");
      const product=await client.query("select id,name,sku,price_minor,stock,currency from products where tenant_id=$1 and sku=$2 and active=true for update",[req.tenant.id,sku]);
      if(!product.rowCount||product.rows[0].stock<quantity)throw new Error("OUT_OF_STOCK");
      const item=product.rows[0],lineTotal=item.price_minor*quantity;total+=lineTotal;lines.push({...item,quantity,lineTotal});
    }
    const orderNumber=`ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const order=await client.query("insert into orders(tenant_id,customer_id,customer_email,order_number,total_minor,currency,status,payment_status,shipping_address,items) values($1,$2,$3,$4,$5,$6,'CONFIRMED','UNPAID',$7,$8) returning *",[req.tenant.id,customer.rows[0].id,email,orderNumber,total,lines[0].currency,JSON.stringify(b.shippingAddress||{}),JSON.stringify(lines.map(x=>({sku:x.sku,name:x.name,quantity:x.quantity,unitPriceMinor:x.price_minor})))]);
    for(const line of lines){
      await client.query("update products set stock=stock-$1,updated_at=now() where tenant_id=$2 and id=$3",[line.quantity,req.tenant.id,line.id]);
      await client.query("insert into order_items(tenant_id,order_id,product_id,sku,product_name,quantity,unit_price_minor,line_total_minor) values($1,$2,$3,$4,$5,$6,$7,$8)",[req.tenant.id,order.rows[0].id,line.id,line.sku,line.name,line.quantity,line.price_minor,line.lineTotal]);
      await client.query("insert into inventory_movements(tenant_id,product_id,order_id,quantity_delta,reason) values($1,$2,$3,$4,'ORDER_CREATED')",[req.tenant.id,line.id,order.rows[0].id,-line.quantity]);
    }
    await client.query("insert into commerce_audit_logs(tenant_id,actor,action,target_type,target_id,metadata) values($1,$2,'ORDER_CREATED','Order',$3,$4)",[req.tenant.id,email,String(order.rows[0].id),JSON.stringify({orderNumber,totalMinor:total})]);
    await client.query("commit");res.status(201).json(order.rows[0]);
  }catch(error){
    await client.query("rollback");
    if(error.message==="CUSTOMER_REQUIRED")return res.status(400).json({error:"Customer account is required"});
    if(error.message==="OUT_OF_STOCK")return res.status(409).json({error:"Product unavailable or insufficient stock"});
    if(error.message==="INVALID_ITEM")return res.status(400).json({error:"Invalid order item"});
    console.error(error);res.status(500).json({error:"Order could not be created"});
  }finally{client.release()}
});
app.get("/api/orders",tenant,async(req,res)=>{const q=await pool.query("select o.*,coalesce(json_agg(oi order by oi.id) filter(where oi.id is not null),'[]') as order_items from orders o left join order_items oi on oi.order_id=o.id and oi.tenant_id=o.tenant_id where o.tenant_id=$1 group by o.id order by o.created_at desc limit 100",[req.tenant.id]);res.json(q.rows)});
app.patch("/api/orders/:id/status",tenant,async(req,res)=>{const status=String(req.body.status||"").toUpperCase(),allowed=["CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"];if(!allowed.includes(status))return res.status(400).json({error:"Invalid order status"});const q=await pool.query("update orders set status=$1,updated_at=now() where tenant_id=$2 and id=$3 returning *",[status,req.tenant.id,req.params.id]);if(!q.rowCount)return res.status(404).json({error:"Order not found"});await pool.query("insert into commerce_audit_logs(tenant_id,actor,action,target_type,target_id,metadata) values($1,$2,'ORDER_STATUS_CHANGED','Order',$3,$4)",[req.tenant.id,req.tenant.owner_email,String(req.params.id),JSON.stringify({status})]);res.json(q.rows[0])});

app.use((error,req,res,next)=>{if(error?.type==="entity.too.large")return res.status(413).json({error:"Request too large"});console.error(error);res.status(500).json({error:"Unexpected server error"})});
app.listen(Number(process.env.PORT||5184),()=>console.log(`E-Commerce API on ${process.env.PORT||5184} (${process.env.APP_MODE||"demo"} mode, payments disabled)`));
