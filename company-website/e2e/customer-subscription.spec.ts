import {test,expect} from "@playwright/test";
import "dotenv/config";
import pg from "pg";

test("new client can request a basic membership and sees provisioning state",async({page})=>{
 const email=`subscription-check-${Date.now()}@example.test`,password="TestClient123!";
 await page.goto("/en/register");
 await page.getByLabel("Full name").fill("Subscription Test Client");
 await page.getByLabel("Business name").fill("Subscription Test Business");
 await page.getByLabel("Email").fill(email);
 await page.getByLabel("Password").fill(password);
 await page.getByRole("checkbox").check();
 await page.getByRole("button",{name:/create/i}).click();
 await expect(page.getByText(/check your email/i)).toBeVisible();

 const client=new pg.Client({connectionString:process.env.DATABASE_URL});
 await client.connect();
 await client.query('update "User" set "emailVerified"=true where email=$1',[email]);
 await client.end();

 await page.goto("/en/login");
 await page.getByLabel("Email").fill(email);
 await page.getByLabel("Password").fill(password);
 await page.getByRole("button",{name:/log in|sign in/i}).click();
 await page.waitForURL(/\/dashboard$/);
 await page.goto("/en/pricing");
 await page.getByRole("link",{name:"Start now"}).first().click();
 await expect(page.getByRole("heading",{name:"Confirm your plan."})).toBeVisible();
 await page.getByLabel("Business name").fill("Subscription Test Business");
 await page.getByRole("button",{name:"Request this plan"}).click();
 await expect(page.getByRole("heading",{name:"Your plan is awaiting activation."})).toBeVisible();
 await page.goto("/en/dashboard/products");
 await expect(page.getByText("Setup in progress")).toBeVisible();
 await expect(page.getByRole("link",{name:"Open product"})).toHaveCount(0);
 console.log(`Created subscription test account: ${email}`);
});
