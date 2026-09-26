import pino from "pino";
const log=pino({redact:["data.password","data.token"]});
export type EmailTemplate="verify-account"|"reset-password"|"welcome"|"subscription-activated"|"subscription-cancelled"|"payment-failed"|"support-reply"|"customization-update";
export async function sendEmail(input:{to:string;template:EmailTemplate;data:Record<string,string>}){if(process.env.NODE_ENV==="production"&&!process.env.EMAIL_API_KEY)throw new Error("Transactional email is not configured");if((process.env.EMAIL_PROVIDER||"console")==="console"){log.info({to:input.to,template:input.template},"Development email queued");return {id:`console_${Date.now()}`};}throw new Error("Configure a production EmailProvider adapter");}
