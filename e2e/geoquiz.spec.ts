import { expect, test } from "@playwright/test";

test("South America starts directly and waits for Next", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /South America/ }).click();

  await expect(page.getByText("Question 1 of 10")).toBeVisible();
  await expect(page.getByText("Choose a region")).toHaveCount(0);

  const target = await page.locator(".prompt h1").innerText();
  const map = page.getByRole("group", {
    name: `Map of South America. Find ${target}.`,
  });
  await expect(map).toBeVisible();
  await expect(map.getByRole("button", { name: target }).first()).toBeVisible();
  await page.getByRole("button", { name: target }).first().click();

  await expect(page.getByText("Correct!")).toBeVisible();
  await expect(page.getByText("Question 1 of 10")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
});

test("short region completes and can be replayed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Oceania/ }).click();
  await page
    .getByRole("button", { name: /Australia and New Zealand/ })
    .last()
    .click();

  for (let index = 0; index < 2; index += 1) {
    const target = await page.locator(".prompt h1").innerText();
    await page.getByRole("button", { name: target }).first().click();
    await page
      .getByRole("button", { name: index === 1 ? "See results" : "Next" })
      .click();
  }

  await expect(page.locator(".score")).toContainText("2/ 2");
  await page.getByRole("button", { name: /Play again/ }).click();
  await expect(page.getByText("Question 1 of 2")).toBeVisible();
});

test("quiz fits an iPhone portrait viewport without document scrolling", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /North America/ }).click();
  await page
    .getByRole("button", { name: /North American Mainland/ })
    .last()
    .click();

  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientHeight,
    document: document.documentElement.scrollHeight,
  }));
  expect(sizes.document).toBeLessThanOrEqual(sizes.viewport + 1);
});
