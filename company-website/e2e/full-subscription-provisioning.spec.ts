import {test,expect} from "@playwright/test";
import "dotenv/config";
import pg from "pg";

test("fresh customer receives a working appointment website after owner approval",async({browser})=>{
 const email=`full-flow-${Date.now()}@example.test`,password="TestClient123!";
 const customerContext=await browser.newContext(),customer=await customerContext.newPage();
 await customer.goto("/en/register");
 await customer.getByLabel("Full name").fill("Full Flow Customer");
 await customer.getByLabel("Business name").fill("Full Flow Business");
 await customer.getByLabel("Email").fill(email);
 await customer.getByLabel("Password").fill(password);
 await customer.getByRole("checkbox").check();
 await customer.getByRole("button",{name:/create/i}).click();
 await expect(customer.getByText(/check your email/i)).toBeVisible();
 const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();await db.query('update "User" set "emailVerified"=true where email=$1',[email]);await db.end();
 await customer.goto("/en/login");
 await customer.getByLabel("Email").fill(email);await customer.getByLabel("Password").fill(password);await customer.getByRole("button",{name:/log in|sign in/i}).click();await customer.waitForURL(/\/dashboard$/);
 await customer.goto("/en/pricing");await customer.getByRole("link",{name:"Start now"}).first().click();await customer.getByLabel("Business name").fill("Full Flow Business");await customer.getByRole("button",{name:"Request this plan"}).click();await expect(customer.getByRole("heading",{name:"Your plan is awaiting activation."})).toBeVisible();

 const ownerContext=await browser.newContext(),owner=await ownerContext.newPage();
 await owner.goto("/en/login");await owner.getByLabel("Email").fill(process.env.DEV_ADMIN_EMAIL||"admin@example.test");await owner.getByLabel("Password").fill(process.env.DEV_ADMIN_PASSWORD||"ChangeMe123!");await owner.getByRole("button",{name:/log in|sign in/i}).click();await owner.waitForURL(/\/admin$/);await owner.goto("/en/admin/subscriptions");
 const membership=owner.locator("article",{hasText:email});await membership.getByRole("button",{name:"Activate without payment"}).click();await membership.getByRole("button",{name:"Start setup"}).click();await expect(membership.getByText(/Tenant: appointment-/)).toBeVisible();

 await customer.goto("/en/dashboard/products");const open=customer.getByRole("link",{name:"Open product"});await expect(open).toBeVisible();const href=await open.getAttribute("href");expect(href).toBeTruthy();await customer.goto(href!);await customer.waitForURL(/10\.0\.0\.21:5173\/\?tenant=appointment-/);await expect(customer.locator("body")).toBeVisible();
 console.log(`Full flow account: ${email}`);console.log(`Provisioned URL: ${customer.url()}`);
 await ownerContext.close();await customerContext.close();
});
