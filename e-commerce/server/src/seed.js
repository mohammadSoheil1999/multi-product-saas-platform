import "dotenv/config";
import crypto from "node:crypto";
import { pool } from "./db.js";

if (process.env.NODE_ENV === "production") throw new Error("Development seed is disabled in production");

const stores = [
  {
    id: "ahmed-fashion", subscription: "dev_ecommerce_ahmed", business: "Ahmed Fashion Store", owner: "client@example.test",
    customers: [["Omar Khalil","omar@customer.example.test","050-411-0001"],["Sara Nassar","sara@customer.example.test","050-411-0002"],["Yousef Ali","yousef@customer.example.test","050-411-0003"]],
    products: [["Linen Blend Overshirt","NOVA-001",8900,30],["Sculpted Leather Bag","NOVA-002",14900,18],["Essential Cotton Tee","NOVA-003",3800,12]],
  },
  {
    id: "maya-electronics", subscription: "dev_ecommerce_maya", business: "Maya Electronics", owner: "maya@electronics.example.test",
    customers: [["Daniel Cohen","daniel@customer.example.test","050-422-0001"],["Noa Levi","noa@customer.example.test","050-422-0002"],["Avi Mizrahi","avi@customer.example.test","050-422-0003"]],
    products: [["Linen Blend Overshirt","NOVA-001",8900,24],["Sculpted Leather Bag","NOVA-002",14900,15],["Essential Cotton Tee","NOVA-003",3800,40]],
  },
  {
    id: "lina-cosmetics", subscription: "dev_ecommerce_lina", business: "Lina Cosmetics", owner: "lina@cosmetics.example.test",
    customers: [["Layla Haddad","layla@customer.example.test","050-433-0001"],["Mariam Saleh","mariam@customer.example.test","050-433-0002"],["Rana Mansour","rana@customer.example.test","050-433-0003"]],
    products: [["Linen Blend Overshirt","NOVA-001",8900,36],["Sculpted Leather Bag","NOVA-002",14900,28],["Essential Cotton Tee","NOVA-003",3800,32]],
  },
];

const client = await pool.connect();
const passwordHash=(password)=>{const salt=crypto.randomBytes(16).toString("hex");return`scrypt:${salt}:${crypto.scryptSync(password,salt,64).toString("hex")}`};
try {
  await client.query("begin");
  for (const store of stores) {
    await client.query(`insert into tenants(id,subscription_id,business_name,owner_email,plan_slug,plan_limits,status)
      values($1,$2,$3,$4,'professional','{"maxUsers":10,"maxLocations":1}','ACTIVE')
      on conflict(id) do update set business_name=excluded.business_name,owner_email=excluded.owner_email,status='ACTIVE',updated_at=now()`,
      [store.id,store.subscription,store.business,store.owner]);

    const productIds = [];
    for (const [name,sku,price,stock] of store.products) {
      const result = await client.query(`insert into products(tenant_id,name,sku,price_minor,currency,stock,active,description)
        values($1,$2,$3,$4,'USD',$5,true,$6)
        on conflict(tenant_id,sku) do update set name=excluded.name,price_minor=excluded.price_minor,currency='USD',stock=excluded.stock,active=true,updated_at=now()
        returning id`, [store.id,name,sku,price,stock,`Development sample product for ${store.business}`]);
      productIds.push(result.rows[0].id);
    }
    const catalogPrices=[89,149,38,128,110,199,329,249,179,64,419,105];
    for(let index=4;index<=36;index++){
      const sku=`NOVA-${String(index).padStart(3,"0")}`,price=catalogPrices[(index-1)%catalogPrices.length]*100;
      await client.query(`insert into products(tenant_id,name,sku,price_minor,currency,stock,active,description)
        values($1,$2,$3,$4,'USD',$5,true,$6)
        on conflict(tenant_id,sku) do update set price_minor=excluded.price_minor,currency='USD',active=true,updated_at=now()`,[store.id,`Catalog Item ${index}`,sku,price,20+index,`Storefront catalog item for ${store.business}`]);
    }

    for (let customerIndex=0; customerIndex<store.customers.length; customerIndex++) {
      const [name,email,phone]=store.customers[customerIndex];
      const customerResult=await client.query(`insert into customers(tenant_id,email,full_name,phone,password_hash,email_verified)
        values($1,$2,$3,$4,$5,true) on conflict(tenant_id,email) do update set full_name=excluded.full_name,phone=excluded.phone,password_hash=coalesce(customers.password_hash,excluded.password_hash),email_verified=true returning id`,[store.id,email,name,phone,passwordHash("Demo123!")]);
      const customerId=customerResult.rows[0].id;
      await client.query(`insert into customer_addresses(tenant_id,customer_id,label,city,street,postal_code,is_default)
        select $1,$2,'Home',$3,$4,$5,true where not exists(select 1 from customer_addresses where tenant_id=$1 and customer_id=$2)`,[store.id,customerId,["Jerusalem","Tel Aviv","Haifa"][customerIndex],`${customerIndex+10} Market Street`,`90${customerIndex}00`]);

      for(let orderIndex=0;orderIndex<3;orderIndex++){
        const orderNumber=`${store.id.toUpperCase().slice(0,4)}-${customerIndex+1}${orderIndex+1}`;
        const productIndex=(customerIndex+orderIndex)%productIds.length;
        const [productName,sku,price]=store.products[productIndex];
        const quantity=orderIndex+1,total=price*quantity;
        const orderResult=await client.query(`insert into orders(tenant_id,customer_id,customer_email,order_number,total_minor,currency,status,payment_status,shipping_address,items)
          values($1,$2,$3,$4,$5,'ILS',$6,'UNPAID',$7,$8)
          on conflict(tenant_id,order_number) where order_number is not null do update set total_minor=excluded.total_minor,status=excluded.status returning id`,
          [store.id,customerId,email,orderNumber,total,["CONFIRMED","PREPARING","SHIPPED"][orderIndex],JSON.stringify({city:["Jerusalem","Tel Aviv","Haifa"][customerIndex],street:`${customerIndex+10} Market Street`}),JSON.stringify([{sku,name:productName,quantity,unitPriceMinor:price}])]);
        const orderId=orderResult.rows[0].id;
        await client.query("delete from order_items where tenant_id=$1 and order_id=$2",[store.id,orderId]);
        await client.query(`insert into order_items(tenant_id,order_id,product_id,sku,product_name,quantity,unit_price_minor,line_total_minor)
          values($1,$2,$3,$4,$5,$6,$7,$8)`,[store.id,orderId,productIds[productIndex],sku,productName,quantity,price,total]);
      }
    }
  }
  await client.query("commit");
  console.log("Seeded 3 stores, 9 customers, storefront catalogs, and 27 orders (development data)");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
