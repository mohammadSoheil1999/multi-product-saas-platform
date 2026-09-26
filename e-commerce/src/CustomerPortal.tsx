import { useEffect, useState } from "react";
import { customerLogin, customerLogout, customerMe, customerRegister, loadCustomerOrders, type StoreCustomer } from "./services/platform";
import type { Lang } from "./types";
import "./customer-auth.css";

const words={
 en:{account:"Customer account",login:"Log in",register:"Create account",name:"Full name",email:"Email",phone:"Phone",password:"Password",newUser:"New customer?",existing:"Already registered?",orders:"My orders",logout:"Log out",empty:"No orders yet."},
 ar:{account:"حساب العميل",login:"تسجيل الدخول",register:"إنشاء حساب",name:"الاسم الكامل",email:"البريد الإلكتروني",phone:"الهاتف",password:"كلمة المرور",newUser:"عميل جديد؟",existing:"لديك حساب؟",orders:"طلباتي",logout:"تسجيل الخروج",empty:"لا توجد طلبات بعد."},
 he:{account:"חשבון לקוח",login:"התחברות",register:"יצירת חשבון",name:"שם מלא",email:"דוא״ל",phone:"טלפון",password:"סיסמה",newUser:"לקוח חדש?",existing:"כבר נרשמתם?",orders:"ההזמנות שלי",logout:"התנתקות",empty:"אין עדיין הזמנות."},
};
export default function CustomerPortal({lang}:{lang:Lang}){
 const t=words[lang], [customer,setCustomer]=useState<StoreCustomer|null>(null),[orders,setOrders]=useState<any[]>([]),[registering,setRegistering]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState("");
 useEffect(()=>{customerMe().then(async c=>{setCustomer(c);setOrders(await loadCustomerOrders())}).catch(()=>{}).finally(()=>setBusy(false))},[]);
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const form=new FormData(event.currentTarget);try{const email=String(form.get("email")),password=String(form.get("password"));if(registering)await customerRegister({fullName:String(form.get("fullName")),email,phone:String(form.get("phone")),password});const result=await customerLogin(email,password);setCustomer(result.customer);setOrders(await loadCustomerOrders())}catch(e){setError(e instanceof Error?e.message:"Authentication failed")}finally{setBusy(false)}}
 async function logout(){await customerLogout();setCustomer(null);setOrders([])}
 if(busy&&!customer)return <main className="customerAuth"><div className="authCard">Loading…</div></main>;
 if(!customer)return <main className="customerAuth"><form className="authCard" onSubmit={submit}><small>{t.account}</small><h1>{registering?t.register:t.login}</h1>{registering&&<><label>{t.name}<input name="fullName" required minLength={2}/></label><label>{t.phone}<input name="phone" type="tel"/></label></>}<label>{t.email}<input name="email" type="email" required autoComplete="email"/></label><label>{t.password}<input name="password" type="password" required minLength={registering?10:1} autoComplete={registering?"new-password":"current-password"}/></label>{error&&<p className="authError" role="alert">{error}</p>}<button className="primary wide" disabled={busy}>{registering?t.register:t.login}</button><button type="button" className="authSwitch" onClick={()=>{setRegistering(!registering);setError("")}}>{registering?t.existing:t.newUser}</button></form></main>;
 return <main className="customerDashboard"><aside><div className="avatar">{customer.fullName.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><h2>{customer.fullName}</h2><p>{customer.email}</p><button onClick={logout}>{t.logout}</button></aside><section><h1>{t.orders}</h1>{orders.length?orders.map(order=><article className="orderCard" key={order.id}><div><strong>#{order.order_number}</strong><span className="status">{String(order.status).replaceAll("_"," ")}</span></div><p>{new Date(order.created_at).toLocaleDateString()} · {(order.total_minor/100).toFixed(2)} {order.currency}</p></article>):<div className="empty">{t.empty}</div>}</section></main>;
}
