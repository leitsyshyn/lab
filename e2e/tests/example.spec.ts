import {
  clearAuthState,
  generateTestUser,
  waitForToast,
} from "../helpers/auth-helpers";
import { expect, test } from "../helpers/fixtures";

test.describe("Example: Complete User Journey", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test("complete user journey from sign-up to sign-in", async ({
    page,
    authPage,
  }) => {
    const testUser = generateTestUser();

    await authPage.gotoSignUp();
    await expect(page.locator("#sign-up-name")).toBeVisible();

    await authPage.fillSignUpForm(testUser);
    await authPage.submitSignUpForm();

    await page.waitForURL((url) => !url.pathname.includes("sign-up"), {
      timeout: 10000,
    });

    const cookies = await page.context().cookies();
    expect(
      cookies.some(
        (c) => c.name.includes("session") || c.name.includes("auth"),
      ),
    ).toBeTruthy();

    await page.goto("/account");
    await expect(page).toHaveURL("/account");

    await expect(page.getByText(testUser.name).first()).toBeVisible();

    await clearAuthState(page);

    await authPage.gotoSignIn();
    await authPage.fillSignInForm({
      email: testUser.email,
      password: testUser.password,
    });
    await authPage.submitSignInForm();

    await page.waitForURL("/", { timeout: 10000 });

    const cookiesAfter = await page.context().cookies();
    expect(
      cookiesAfter.some(
        (c) => c.name.includes("session") || c.name.includes("auth"),
      ),
    ).toBeTruthy();
  });

  test("example: testing validation errors", async ({ page, authPage }) => {
    await authPage.gotoSignUp();

    await page.fill("#sign-up-name", "A"); // Too short
    await page.fill("#sign-up-email", "invalid"); // Invalid format
    await page.fill("#sign-up-password", "short"); // Too short
    await page.fill("#sign-up-confirm-password", "different"); // Doesn't match

    await authPage.submitSignUpForm();

    await expect(page).toHaveURL(/.*sign-up/);
  });

  test("example: testing error recovery", async ({ page, authPage }) => {
    const testUser = generateTestUser();

    await authPage.signUp(testUser);
    await page.waitForURL((url) => !url.pathname.includes("sign-up"), {
      timeout: 10000,
    });

    await clearAuthState(page);

    await authPage.gotoSignIn();
    await authPage.fillSignInForm({
      email: testUser.email,
      password: "WrongPassword123!",
    });
    await authPage.submitSignInForm();

    await waitForToast(page);
    await expect(page).toHaveURL(/.*sign-in/);

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

  test("example: testing accessibility", async ({ page, authPage }) => {
    await authPage.gotoSignIn();

    const emailInput = page.locator("#sign-in-email");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("autocomplete", "email");

    const passwordInput = page.locator("#sign-in-password");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveAttribute(
      "autocomplete",
      "current-password",
    );

    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    await passwordInput.focus();
    await expect(passwordInput).toBeFocused();
  });

  test("example: testing mobile viewport", async ({ page, authPage }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await authPage.gotoSignIn();

    await expect(page.locator("#sign-in-email")).toBeVisible();
    await expect(page.locator("#sign-in-password")).toBeVisible();

    const testUser = generateTestUser();

    await authPage.signUp(testUser);
    await page.waitForURL((url) => !url.pathname.includes("sign-up"), {
      timeout: 10000,
    });

    await clearAuthState(page);
    await authPage.gotoSignIn();
    await authPage.fillSignInForm({
      email: testUser.email,
      password: testUser.password,
    });
    await authPage.submitSignInForm();

    await page.waitForURL((url) => !url.pathname.includes("sign-in"), {
      timeout: 10000,
    });

    const cookies = await page.context().cookies();
    expect(
      cookies.some(
        (c) => c.name.includes("session") || c.name.includes("auth"),
      ),
    ).toBeTruthy();
  });
});
