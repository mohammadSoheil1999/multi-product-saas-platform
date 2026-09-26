const express=require("express");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const{resolveTenant}=require("../utils/tenant");
const router=express.Router();

function normalizePhone(value){
 let digits=String(value||"").replace(/\D/g,"");
 if(digits.startsWith("00972"))digits=`0${digits.slice(5)}`;
 else if(digits.startsWith("972"))digits=`0${digits.slice(3)}`;
 return digits;
}

router.post("/register",resolveTenant,async(req,res)=>{const{name,phonenumber,password}=req.body;if(!name||!phonenumber||!password)return res.status(400).json({message:"All fields required"});const cleanName=String(name).trim(),cleanPhone=String(phonenumber).trim();if(cleanName.length>100||cleanPhone.length>20||String(password).length<8)return res.status(400).json({message:"Invalid registration details"});try{const hashed=await bcrypt.hash(String(password),10);await req.db.promise().query("INSERT INTO users (tenant_id,phonenumber,name,password,is_verified,role,is_active) VALUES (?,?,?,?,0,'normal',1)",[req.tenantId,cleanPhone,cleanName,hashed]);res.status(201).json({message:"User registered successfully"})}catch(error){if(error.code==="ER_DUP_ENTRY")return res.status(409).json({message:"Phone number already registered for this business"});res.status(500).json({message:"Database error"})}});

router.post("/login",resolveTenant,async(req,res)=>{const{phonenumber,password}=req.body;if(!phonenumber||!password)return res.status(400).json({message:"Missing credentials"});const cleanPhone=normalizePhone(phonenumber);if(!cleanPhone)return res.status(400).json({message:"Missing credentials"});try{const[rows]=await req.db.promise().query("SELECT id,tenant_id,phonenumber,name,password,is_verified,role,is_active FROM users WHERE tenant_id=? AND REGEXP_REPLACE(phonenumber,'[^0-9]','')=? LIMIT 1",[req.tenantId,cleanPhone]);if(!rows.length)return res.status(400).json({message:"User not found"});const user=rows[0];if(!await bcrypt.compare(String(password),user.password))return res.status(400).json({message:"Wrong password"});if(Number(user.is_verified)!==1)return res.status(403).json({message:"Account not approved yet"});if(Number(user.is_active)!==1)return res.status(403).json({message:"Account is blocked"});const token=jwt.sign({userId:user.id,tenantId:user.tenant_id,phonenumber:user.phonenumber,name:user.name,role:user.role},process.env.JWT_SECRET,{expiresIn:"7d"});res.json({message:"Login successful",token,tenantId:user.tenant_id})}catch(error){console.error("Login error",error.code||error.message);res.status(500).json({message:"Authentication failed"})}});
module.exports=router;
