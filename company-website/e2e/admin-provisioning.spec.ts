import {test,expect} from "@playwright/test";
import "dotenv/config";

test("admin provisions the requested appointment website",async({page})=>{
 const customer="full-flow-1787506189757@example.test";
 await page.goto("/en/login");
 await page.getByLabel("Email").fill(process.env.DEV_ADMIN_EMAIL||"admin@example.test");
 await page.getByLabel("Password").fill(process.env.DEV_ADMIN_PASSWORD||"ChangeMe123!");
 await page.getByRole("button",{name:/log in|sign in/i}).click();
 await page.waitForURL(/\/admin$/);
 await page.goto("/en/admin/subscriptions");
 const membership=page.locator("article",{hasText:customer});
 await expect(membership).toBeVisible();
 const activate=membership.getByRole("button",{name:"Activate without payment"});
 if(await activate.isVisible())await activate.click();
 await membership.getByRole("button",{name:/start setup|re-provision/i}).click();
 await expect(membership.getByText(/Tenant: appointment-/)).toBeVisible();
 await expect(membership.getByRole("alert")).toHaveCount(0);
});
