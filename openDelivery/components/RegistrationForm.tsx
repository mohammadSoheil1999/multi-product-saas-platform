"use client";
import {useSearchParams} from "next/navigation";
import {useEffect,useState} from "react";
import {DEFAULT_BUSINESS_CATEGORIES} from "@/features/categories/defaults";

export function RegistrationForm(){
 const sp=useSearchParams();
 const [role,setRole]=useState(sp.get("role")==="courier"?"COURIER":"BUSINESS");
 const [message,setMessage]=useState("");
 const [verificationUrl,setVerificationUrl]=useState("");
 const [categories,setCategories]=useState<string[]>([...DEFAULT_BUSINESS_CATEGORIES]);
 const [serviceAreas,setServiceAreas]=useState<Array<{id:string;name:string;city:string}>>([]);
 useEffect(()=>{fetch("/api/categories").then(r=>r.ok?r.json():null).then(r=>r?.data?.length&&setCategories(r.data.map((x:{name:string})=>x.name))).catch(()=>{})},[]);
 useEffect(()=>{fetch("/api/service-areas").then(r=>r.ok?r.json():null).then(r=>r?.data&&setServiceAreas(r.data)).catch(()=>{})},[]);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setMessage("Creating account…");setVerificationUrl("");
  const f=new FormData(e.currentTarget);const common={role,name:f.get("name"),email:f.get("email"),phone:f.get("phone"),password:f.get("password"),preferredLanguage:f.get("language"),termsAccepted:true,privacyAccepted:true,tenantSlug:"default",city:f.get("city")};
  const body=role==="BUSINESS"?{...common,businessName:f.get("businessName"),category:f.get("category"),address:f.get("address"),latitude:32.6996,longitude:35.3035}:{...common,vehicleType:f.get("vehicleType"),serviceAreaIds:String(f.get("serviceAreas")).split(",").filter(Boolean),independentDeclarationAccepted:true};
  const r=await fetch("/api/register",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const result=await r.json().catch(()=>null);
  if(r.ok){setMessage("Account created. Verify your email before signing in.");setVerificationUrl(result?.data?.developmentVerificationUrl??"")}else{const code=result?.error?.code;setMessage(code==="INTERNAL_ERROR"?"This email may already be registered. Try signing in or use another email.":`Registration failed: ${code??"check the entered details"}.`)}
 }
 return <form className="form-grid" onSubmit={submit}>
  <div className="field full"><label>Account type<select value={role} onChange={e=>setRole(e.target.value as typeof role)}><option value="BUSINESS">Business</option><option value="COURIER">Independent courier</option></select></label></div>
  <Field n="name" l="Full name"/><Field n="email" l="Email" t="email"/><Field n="phone" l="Phone" t="tel"/><Field n="password" l="Password" t="password"/><Field n="city" l="City"/>
  <div className="field"><label>Preferred language<select name="language"><option value="en">English</option><option value="ar">العربية</option><option value="he">עברית</option></select></label></div>
  {role==="BUSINESS"?<><Field n="businessName" l="Business name"/><div className="field"><label>Business category<select name="category" required>{categories.map(x=><option key={x}>{x}</option>)}</select></label></div><Field n="address" l="Business address"/></>:<><div className="field"><label>Vehicle<select name="vehicleType"><option value="CAR">Car</option><option value="MOTORCYCLE">Motorcycle</option><option value="SCOOTER">Scooter</option><option value="BICYCLE">Bicycle</option><option value="WALKING">Walking</option><option value="OTHER">Other</option></select></label></div><div className="field"><label>Service area<select name="serviceAreas" required disabled={!serviceAreas.length}><option value="">Select an area</option>{serviceAreas.map(x=><option value={x.id} key={x.id}>{x.name} — {x.city}</option>)}</select></label>{!serviceAreas.length&&<small>No active service areas are available. Contact an administrator.</small>}</div><div className="card full"><b>Independent service provider declaration</b><p>I understand that OpenDelivery is a technology marketplace and does not employ me. I independently choose when to work and which delivery requests to accept. I am responsible for applicable legal, tax, licensing, vehicle, insurance and regulatory requirements.</p></div></>}
  <label className="full"><input type="checkbox" required/> I accept the Terms of Service and Privacy Policy.</label><div className="notice full" style={{padding:20}}>OpenDelivery connects businesses and independent couriers. Cash is exchanged directly between participating parties.</div><button className="btn btn-primary full">Create account</button>{message&&<p className="full" role="status">{message}</p>}{verificationUrl&&<a className="btn btn-primary full" href={verificationUrl}>Verify development account</a>}
 </form>
}
function Field({n,l,t="text"}:{n:string;l:string;t?:string}){return <div className="field"><label>{l}<input name={n} type={t} required minLength={t==="password"?12:undefined}/></label></div>}
