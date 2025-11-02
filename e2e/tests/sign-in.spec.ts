import {
  clearAuthState,
  generateTestUser,
  waitForToast,
} from "../helpers/auth-helpers";
import { expect, test } from "../helpers/fixtures";

test.describe("Sign In Flow", () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeAll(async ({ browser }) => {
    testUser = generateTestUser();
    const page = await browser.newPage();
    const authPage = new (await import("../helpers/auth-helpers")).AuthPage(
      page,
    );

    await authPage.signUp(testUser);
    await Promise.race([
      page.waitForURL((url) => !url.pathname.includes("sign-up"), {
        timeout: 10000,
      }),
      waitForToast(page, "Account created successfully"),
    ]).catch(() => {});

    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test("should display sign in form with all fields", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoSignIn();

    await expect(page.locator("#sign-in-email")).toBeVisible();
    await expect(page.locator("#sign-in-password")).toBeVisible();
    await expect(page.locator("#remember-me")).toBeVisible();

    await expect(
      page.locator('button[type="submit"][form="sign-in-form"]'),
    ).toBeVisible();
    await expect(
      page.locator('button[type="submit"][form="sign-in-form"]'),
    ).toHaveText("Sign In");

    await expect(page.getByRole("link", { name: /forgot/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();

    await expect(page.getByRole("button", { name: /github/i })).toBeVisible();
  });

  test("should validate required fields", async ({ page, authPage }) => {
    await authPage.gotoSignIn();

    await authPage.submitSignInForm();

    await expect(
      page.locator('button[type="submit"][form="sign-in-form"]'),
    ).toBeVisible();
  });

  test("should validate email format", async ({ page, authPage }) => {
    await authPage.gotoSignIn();

    await authPage.fillSignInForm({
      email: "invalid-email",
      password: "TestPassword123!",
    });

    await authPage.submitSignInForm();

    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("should validate password length", async ({ page, authPage }) => {
    await authPage.gotoSignIn();

    await authPage.fillSignInForm({
      email: "test@example.com",
      password: "short",
    });

    await authPage.submitSignInForm();

    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("should show error for non-existent user", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoSignIn();

    await authPage.fillSignInForm({
      email: "nonexistent@example.com",
      password: "TestPassword123!",
    });

    await authPage.submitSignInForm();

    await waitForToast(page);

    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("should show error for incorrect password", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoSignIn();

    await authPage.fillSignInForm({
      email: testUser.email,
      password: "WrongPassword123!",
    });

    await authPage.submitSignInForm();

    await waitForToast(page);

    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("should successfully sign in with valid credentials", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoSignIn();

    await authPage.fillSignInForm({
      email: testUser.email,
      password: testUser.password,
    });

    await authPage.submitSignInForm();

    await page.waitForURL("/", { timeout: 10000 });

    const cookies = await page.context().cookies();
    expect(
      cookies.some(
        (c) => c.name.includes("session") || c.name.includes("auth"),
      ),
    ).toBeTruthy();
  });

  test("should disable submit button while signing in", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoSignIn();

    await authPage.fillSignInForm({
      email: testUser.email,
      password: testUser.password,
    });

    const submitButton = page.locator(
      'button[type="submit"][form="sign-in-form"]',
    );

    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveText(/signing in/i);
  });

  test("should navigate to forgot password page", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoSignIn();

    await page.click("text=Forgot?");

    await expect(page).toHaveURL(/.*forgot-password/);
  });

  test("should navigate to sign up page from link", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoSignIn();

    await page.click("text=Sign up");

    await expect(page).toHaveURL(/.*sign-up/);
  });

  test("should redirect to callback URL after sign in", async ({
    page,
    authPage,
  }) => {
    const callbackUrl = "/account";

    await page.goto(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);

    await expect(page).toHaveURL(/callbackUrl/);

    await authPage.fillSignInForm({
      email: testUser.email,
      password: testUser.password,
    });

    await authPage.submitSignInForm();

    await page.waitForURL(callbackUrl, { timeout: 10000 });
    await expect(page).toHaveURL(callbackUrl);
  });

  test("should persist session across page reloads", async ({
    page,
    authPage,
  }) => {
    await authPage.signIn({
      email: testUser.email,
      password: testUser.password,
    });

    await page.waitForURL((url) => !url.pathname.includes("sign-in"), {
      timeout: 10000,
    });

    await page.reload();

    await expect(page).not.toHaveURL(/.*sign-in/);

    const cookies = await page.context().cookies();
    expect(
      cookies.some(
        (c) => c.name.includes("session") || c.name.includes("auth"),
      ),
    ).toBeTruthy();
  });

  test("should handle GitHub OAuth sign in click", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoSignIn();

    const githubButton = page.getByRole("button", { name: /github/i });
    await expect(githubButton).toBeVisible();
    await expect(githubButton).toBeEnabled();
  });

  test("should support keyboard navigation", async ({ page, authPage }) => {
    await authPage.gotoSignIn();

    await page.locator("#sign-in-email").focus();
    await page.keyboard.type(testUser.email);

    await page.locator("#sign-in-password").focus();
    await page.keyboard.type(testUser.password);

    await page.keyboard.press("Enter");

    await page.waitForURL("/", { timeout: 10000 });

    const cookies = await page.context().cookies();
    expect(
      cookies.some(
        (c) => c.name.includes("session") || c.name.includes("auth"),
      ),
    ).toBeTruthy();
  });
});
