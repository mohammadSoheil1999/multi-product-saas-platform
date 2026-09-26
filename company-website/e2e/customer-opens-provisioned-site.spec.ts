import {test,expect} from "@playwright/test";
test("fresh customer opens the newly provisioned website",async({page})=>{
 await page.goto("/en/login");await page.getByLabel("Email").fill("full-flow-1787506189757@example.test");await page.getByLabel("Password").fill("TestClient123!");await page.getByRole("button",{name:/log in|sign in/i}).click();await page.waitForURL(/\/dashboard$/);
 await page.goto("/en/dashboard/products");const open=page.getByRole("link",{name:"Open product"});await expect(open).toBeVisible();await page.goto((await open.getAttribute("href"))!);await page.waitForURL(/10\.0\.0\.21:5173\/\?tenant=appointment-/);await expect(page.locator("body")).toBeVisible();console.log(`Opened website: ${page.url()}`);
});
