import type{CartItem,Order}from"../types";
const handoff=new URLSearchParams(location.search).get("handoff")||"";
const tenantSlug=new URLSearchParams(location.search).get("tenant")||"";
// The base URL remains the untouched public demo; a signed company handoff
// activates the database-backed tenant in the same independently deployed app.
export const demoMode=!handoff&&!tenantSlug&&import.meta.env.VITE_APP_MODE!=="production";
const base=import.meta.env.VITE_API_URL||"http://localhost:5184/api";
function applyStoreBrand(name:string){document.title=name;document.body.classList.add("tenant-store");const sync=()=>document.querySelectorAll<HTMLElement>(".logo,.checkoutLogo").forEach(x=>{x.dataset.storeName=name});sync();new MutationObserver(sync).observe(document.body,{childList:true,subtree:true})}
let ready:Promise<void>|undefined;function ensureSession(){if(demoMode)return Promise.resolve();if(!ready){const endpoint=handoff?"platform/session":"platform/dev-session",payload=handoff?{handoff}:{tenant:tenantSlug};ready=fetch(`${base}/${endpoint}`,{method:"POST",credentials:"include",headers:{"content-type":"application/json"},body:JSON.stringify(payload)}).then(async r=>{if(!r.ok)throw new Error("Product sign-in failed");const data=await r.json();if(data.businessName)applyStoreBrand(data.businessName);if(handoff)history.replaceState({},"",location.pathname)})}return ready}
async function request(path:string,init?:RequestInit){await ensureSession();const response=await fetch(`${base}${path}`,{...init,credentials:"include",headers:{"content-type":"application/json",...init?.headers}});if(!response.ok)throw new Error(`Platform request failed (${response.status})`);return response.json()}
async function customerRequest(path:string,init?:RequestInit){await ensureSession();const response=await fetch(`${base}/customer/${path}`,{...init,credentials:"include",headers:{"content-type":"application/json",...init?.headers}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Customer request failed");return data}
export type StoreCustomer={id:number;email:string;fullName:string;phone?:string};
export const customerMe=()=>customerRequest("me") as Promise<StoreCustomer>;
export const customerLogin=(email:string,password:string)=>customerRequest("login",{method:"POST",body:JSON.stringify({email,password})}) as Promise<{customer:StoreCustomer}>;
export const customerRegister=(input:{fullName:string;email:string;phone:string;password:string})=>customerRequest("register",{method:"POST",body:JSON.stringify(input)});
export const customerLogout=()=>customerRequest("logout",{method:"POST"});
export const loadCustomerOrders=()=>customerRequest("orders") as Promise<any[]>;
export async function loadOrders():Promise<Order[]>{if(demoMode)return[];const rows=await request("/orders");return rows.map((x:any)=>({id:String(x.id),date:new Date(x.created_at).toLocaleDateString(),total:x.total_minor/100,status:"Confirmed",items:x.items,address:Object.values(x.shipping_address||{}).join(", "),lastFour:""}))}
export async function createOrder(input:{email:string,total:number;address:Record<string,string>;items:CartItem[]}){return request("/orders",{method:"POST",body:JSON.stringify({customerEmail:input.email,totalMinor:Math.round(input.total*100),currency:"USD",shippingAddress:input.address,items:input.items})})}
