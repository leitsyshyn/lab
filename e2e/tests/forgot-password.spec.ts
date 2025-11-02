import {
  clearAuthState,
  generateTestUser,
  waitForToast,
} from "../helpers/auth-helpers";
import { expect, test } from "../helpers/fixtures";

test.describe("Forgot Password Flow", () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeAll(async ({ browser }) => {
    testUser = generateTestUser();
    const page = await browser.newPage();
    const authPage = new (await import("../helpers/auth-helpers")).AuthPage(
      page,
    );

    await authPage.signUp(testUser);
    await waitForToast(page, "Account created successfully");
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test("should display forgot password form", async ({ page, authPage }) => {
    await authPage.gotoForgotPassword();

    await expect(page.getByText("Forgot password")).toBeVisible();
    await expect(
      page.getByText("Enter your email to reset your password"),
    ).toBeVisible();

    await expect(page.locator("#forgot-password-email")).toBeVisible();

    await expect(
      page.locator('button[type="submit"][form="forgot-password-form"]'),
    ).toBeVisible();
    await expect(
      page.locator('button[type="submit"][form="forgot-password-form"]'),
    ).toHaveText("Send reset link");

    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("should validate email format", async ({ page, authPage }) => {
    await authPage.gotoForgotPassword();

    await authPage.fillForgotPasswordForm("invalid-email");
    await authPage.submitForgotPasswordForm();

    await expect(page).toHaveURL(/.*forgot-password/);
  });

  test("should validate required email field", async ({ page, authPage }) => {
    await authPage.gotoForgotPassword();

    await authPage.submitForgotPasswordForm();

    await expect(
      page.locator('button[type="submit"][form="forgot-password-form"]'),
    ).toBeVisible();
  });

  test("should successfully send reset email for valid user", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoForgotPassword();

    await authPage.fillForgotPasswordForm(testUser.email);
    await authPage.submitForgotPasswordForm();

    await waitForToast(page, "Password reset email sent");

    await expect(page.getByText("Check your email")).toBeVisible();
    await expect(
      page.getByText(/We've sent a password reset link/i),
    ).toBeVisible();
  });

  test("should handle non-existent email gracefully", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoForgotPassword();

    await authPage.fillForgotPasswordForm("nonexistent@example.com");
    await authPage.submitForgotPasswordForm();

    await waitForToast(page);
  });

  test("should disable submit button while sending", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoForgotPassword();

    await authPage.fillForgotPasswordForm(testUser.email);

    const submitButton = page.locator(
      'button[type="submit"][form="forgot-password-form"]',
    );

    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveText(/sending/i);
  });

  test("should navigate back to sign in from link", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoForgotPassword();

    await page.click("text=Sign in");

    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("should allow going back to reset form from confirmation", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoForgotPassword();

    await authPage.fillForgotPasswordForm(testUser.email);
    await authPage.submitForgotPasswordForm();

    await expect(page.getByText("Check your email")).toBeVisible();

    const backButton = page.getByRole("button", {
      name: /back to reset password/i,
    });
    await backButton.click();

    await expect(page.locator("#forgot-password-email")).toBeVisible();
  });

  test("should mention spam folder in confirmation", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoForgotPassword();

    await authPage.fillForgotPasswordForm(testUser.email);
    await authPage.submitForgotPasswordForm();

    await expect(page.getByText(/check your spam folder/i)).toBeVisible();
  });

  test("should trim whitespace from email", async ({ page, authPage }) => {
    await authPage.gotoForgotPassword();

    await page.fill("#forgot-password-email", `  ${testUser.email}  `);
    await authPage.submitForgotPasswordForm();

    await waitForToast(page, "Password reset email sent");
  });
});
