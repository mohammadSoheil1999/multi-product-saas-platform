const DEFAULT_TENANT_ID=process.env.DEFAULT_TENANT_ID||"luxorius-demo";
// Prefer an explicit request value over a possibly stale browser/default header.
function requestedTenant(req){return String(req.body?.tenant||req.query?.tenant||req.get("x-tenant")||DEFAULT_TENANT_ID).trim().toLowerCase()}
function resolveTenant(req,res,next){if(req.user?.tenantId){req.tenantId=req.user.tenantId;return next()}const requested=requestedTenant(req);req.db.query("SELECT id FROM tenants WHERE (id=? OR slug=?) AND status='ACTIVE' LIMIT 1",[requested,requested],(error,rows)=>{if(error)return res.status(500).json({message:"Unable to resolve business"});if(!rows.length)return res.status(404).json({message:"Business not found"});req.tenantId=rows[0].id;next()})}
module.exports={DEFAULT_TENANT_ID,requestedTenant,resolveTenant};
