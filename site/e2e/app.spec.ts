import { expect, test, type Page } from "@playwright/test";

/** Press and hold an element long enough to complete a hold-to-confirm control. */
async function hold(page: Page, name: RegExp | string) {
  const el = page.getByRole("button", { name }).first();
  await el.scrollIntoViewIfNeeded();
  const box = (await el.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1100);
  await page.mouse.up();
}

/** Collects every failed same-origin request and every console error, so a missing file can never hide behind a blank page. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on("response", (r) => {
    const u = new URL(r.url());
    if (u.origin === new URL(page.url() === "about:blank" ? r.url() : page.url()).origin && r.status() >= 400 && !u.pathname.startsWith("/api/")) problems.push(`${r.status()} ${u.pathname}`);
  });
  page.on("console", (m) => { if (m.type() === "error") problems.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

test("the site's Open the app button leads to a working app, not a blank page", async ({ page }) => {
  const problems = watch(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Open the live app" }).click();
  await expect(page).toHaveURL(/\/app\/?/);
  await expect(page.getByText("Pick the place first.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
  expect(problems, problems.join("\n")).toEqual([]);
});

test("a deep link inside the app renders, not a blank page", async ({ page }) => {
  const problems = watch(page);
  await page.goto("/app/plans");
  await expect(page.getByText("No plans yet.", { exact: false })).toBeVisible();
  expect(problems, problems.join("\n")).toEqual([]);
});

test("the whole flow works: onboarding, private hook, unlock, plan, chat nudge, close", async ({ page }) => {
  const problems = watch(page);
  await page.goto("/app");
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("button", { name: "I agree" }).click();
  await page.getByLabel("First name").fill("Aom");
  await page.getByLabel("Birth year").fill("1996");
  await page.getByRole("button", { name: "Woman", exact: true }).click();
  await page.getByRole("button", { name: "Next" }).click();
  for (const place of ["Lumphini Park", "Or Tor Kor Market", "Yaowarat street food"]) await page.getByRole("button", { name: `Pin ${place}` }).click();
  await page.getByRole("button", { name: "Next" }).click();
  for (const slot of ["Sat Evening", "Sat Afternoon", "Sun Morning"]) await page.getByRole("button", { name: slot }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();

  // The hook is private: after tapping, only "your pinky is out" is shown.
  await expect(page.getByText("Today's introductions")).toBeVisible();
  await hold(page, /Hook pinkies Mint/);
  await expect(page.getByText("Your pinky is out.")).toBeVisible();
  await expect(page.getByText("both hooked pinkies")).toHaveCount(0);

  // The sample person hooks back after a moment: both find out, with a neutral notice.
  await expect(page.getByText("You and Mint both hooked pinkies.")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Something nice is waiting for you")).toBeVisible();
  await page.getByRole("button", { name: "Open our plan" }).click();

  // The plan uses the place both pinned, and a link is never sent in chat.
  await expect(page.getByText("Plan with Mint")).toBeVisible();
  // One of the three shared places is proposed (the pick is seeded per plan, so it varies).
  await expect(page.getByText(/You both pinned (Lumphini Park|Or Tor Kor Market|Yaowarat street food)\./)).toBeVisible();
  await hold(page, /Confirm this plan/);
  await page.getByRole("textbox", { name: "Message" }).fill("https://example.com");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Links aren't sent in Koi.")).toBeVisible();
  expect(problems, problems.join("\n")).toEqual([]);
});

test("the website demo: hold to hook, then paint free times", async ({ page }) => {
  await page.goto("/");
  // Pin three places on the demo map, then hold the pinky ring to hook (a plain click must not complete it).
  for (const place of ["Lumphini Park", "Or Tor Kor Market", "Yaowarat street food"]) await page.getByRole("button", { name: `Pin ${place}` }).first().click();
  const ring = page.getByRole("button", { name: "Hook pinkies" }).first();
  await ring.scrollIntoViewIfNeeded();
  await ring.click();
  await expect(page.getByText("Hold it down, or click twice").locator("visible=true")).toBeVisible();
  await hold(page, "Hook pinkies");
  await expect(page.getByText("Your pinky is out.").locator("visible=true")).toBeVisible();
  // Drag across the Saturday dots to paint them.
  const a = page.locator('[data-slot="6-a"]'), e = page.locator('[data-slot="6-e"]');
  await a.scrollIntoViewIfNeeded();
  const ba = (await a.boundingBox())!, be = (await e.boundingBox())!;
  await page.mouse.move(ba.x + ba.width / 2, ba.y + ba.height / 2);
  await page.mouse.down();
  await page.mouse.move(be.x + be.width / 2, be.y + be.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(a).toHaveAttribute("aria-pressed", "true");
  await expect(e).toHaveAttribute("aria-pressed", "true");
});
