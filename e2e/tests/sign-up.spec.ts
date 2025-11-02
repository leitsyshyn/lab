import {
  clearAuthState,
  generateTestUser,
  waitForToast,
} from "../helpers/auth-helpers";
import { expect, test } from "../helpers/fixtures";

test.describe("Sign Up Flow", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test("should display sign up form with all fields", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoSignUp();

    await expect(page.locator("#sign-up-name")).toBeVisible();
    await expect(page.locator("#sign-up-email")).toBeVisible();
    await expect(page.locator("#sign-up-password")).toBeVisible();
    await expect(page.locator("#sign-up-confirm-password")).toBeVisible();

    await expect(
      page.locator('button[type="submit"][form="sign-up-form"]'),
    ).toBeVisible();
    await expect(
      page.locator('button[type="submit"][form="sign-up-form"]'),
    ).toHaveText("Sign Up");

    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("should validate required fields", async ({ page, authPage }) => {
    await authPage.gotoSignUp();

    await authPage.submitSignUpForm();

    await expect(
      page.locator('button[type="submit"][form="sign-up-form"]'),
    ).toBeVisible();
  });

  test("should validate name length", async ({ page, authPage }) => {
    await authPage.gotoSignUp();

    await authPage.fillSignUpForm({
      name: "A",
      email: "test@example.com",
      password: "TestPassword123!",
      confirmPassword: "TestPassword123!",
    });

    await authPage.submitSignUpForm();

    await expect(page).toHaveURL(/.*sign-up/);
  });

  test("should validate email format", async ({ page, authPage }) => {
    await authPage.gotoSignUp();

    await authPage.fillSignUpForm({
      name: "Test User",
      email: "invalid-email",
      password: "TestPassword123!",
      confirmPassword: "TestPassword123!",
    });

    await authPage.submitSignUpForm();

    await expect(page).toHaveURL(/.*sign-up/);
  });

  test("should validate password length", async ({ page, authPage }) => {
    await authPage.gotoSignUp();

    await authPage.fillSignUpForm({
      name: "Test User",
      email: "test@example.com",
      password: "short",
      confirmPassword: "short",
    });

    await authPage.submitSignUpForm();

    await expect(page).toHaveURL(/.*sign-up/);
  });

  test("should validate password confirmation match", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoSignUp();

    await authPage.fillSignUpForm({
      name: "Test User",
      email: "test@example.com",
      password: "TestPassword123!",
      confirmPassword: "DifferentPassword123!",
    });

    await authPage.submitSignUpForm();

    await expect(page).toHaveURL(/.*sign-up/);
  });

  test("should successfully create a new account", async ({
    page,
    authPage,
  }) => {
    const testUser = generateTestUser();

    await authPage.gotoSignUp();
    await authPage.fillSignUpForm(testUser);
    await authPage.submitSignUpForm();

    await waitForToast(page, "Account created successfully");

    await expect(page).not.toHaveURL(/.*sign-up/);
  });

  test("should show error for duplicate email", async ({ page, authPage }) => {
    const testUser = generateTestUser();

    await authPage.signUp(testUser);
    await waitForToast(page, "Account created successfully");

    await clearAuthState(page);
    await authPage.signUp(testUser);

    await waitForToast(page);
    await expect(page).toHaveURL(/.*sign-up/);
  });

  test("should disable submit button while submitting", async ({
    page,
    authPage,
  }) => {
    const testUser = generateTestUser();

    await authPage.gotoSignUp();
    await authPage.fillSignUpForm(testUser);

    const submitButton = page.locator(
      'button[type="submit"][form="sign-up-form"]',
    );

    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveText(/creating account/i);
  });

  test("should navigate to sign in page from link", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoSignUp();

    await page.click("text=Sign in");

    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("should allow optional profile image upload", async ({
    page,
    authPage,
  }) => {
    await authPage.gotoSignUp();

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    const testUser = generateTestUser();
    await authPage.fillSignUpForm(testUser);
    await authPage.submitSignUpForm();

    await waitForToast(page, "Account created successfully");
  });

  test("should trim whitespace from inputs", async ({ page, authPage }) => {
    const testUser = generateTestUser();

    await authPage.gotoSignUp();

    await page.fill("#sign-up-name", `  ${testUser.name}  `);
    await page.fill("#sign-up-email", `  ${testUser.email}  `);
    await page.fill("#sign-up-password", testUser.password);
    await page.fill("#sign-up-confirm-password", testUser.password);

    await authPage.submitSignUpForm();

    await waitForToast(page, "Account created successfully");
  });
});
