import {
  clearAuthState,
  generateTestUser,
  isAuthenticated,
  waitForToast,
} from "../helpers/auth-helpers";
import { expect, test } from "../helpers/fixtures";

test.describe("Authenticated Session Flow", () => {
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

  test("should maintain session across page navigations", async ({
    page,
    authPage,
  }) => {
    await authPage.signIn({
      email: testUser.email,
      password: testUser.password,
    });

    await page.waitForURL("/", { timeout: 10000 });

    await page.goto("/");
    expect(await isAuthenticated(page)).toBeTruthy();

    await page.goto("/account");
    expect(await isAuthenticated(page)).toBeTruthy();

    await expect(page).toHaveURL("/account");
  });

  test("should access account page when authenticated", async ({
    page,
    authPage,
  }) => {
    await page.goto("/sign-in?callbackUrl=%2Faccount");
    await authPage.fillSignInForm({
      email: testUser.email,
      password: testUser.password,
    });
    await authPage.submitSignInForm();

    await page.waitForURL("/account", { timeout: 10000 });

    await expect(page).toHaveURL("/account");
    await expect(page.getByText(testUser.name).first()).toBeVisible();
  });

  test("should redirect to sign in when accessing protected route without auth", async ({
    page,
  }) => {
    await page.goto("/account");
    await expect(page).toHaveURL("/sign-in");
  });

  test("should successfully sign out", async ({ page, authPage }) => {
    await page.goto("/sign-in?callbackUrl=%2Faccount");
    await authPage.fillSignInForm({
      email: testUser.email,
      password: testUser.password,
    });
    await authPage.submitSignInForm();

    await page.waitForURL("/account", { timeout: 10000 });
    expect(await isAuthenticated(page)).toBeTruthy();

    const signOutButton = page.getByRole("button", { name: /sign out/i });
    await signOutButton.click();

    await page.waitForTimeout(1000);

    expect(await isAuthenticated(page)).toBeFalsy();
    await expect(page).not.toHaveURL("/account");
  });

  test("should clear session data after sign out", async ({
    page,
    authPage,
  }) => {
    await page.goto("/sign-in?callbackUrl=%2Faccount");
    await authPage.fillSignInForm({
      email: testUser.email,
      password: testUser.password,
    });
    await authPage.submitSignInForm();

    await page.waitForURL("/account", { timeout: 10000 });

    const signOutButton = page.getByRole("button", { name: /sign out/i });
    await signOutButton.click();

    await page.waitForTimeout(1000);

    const cookies = await page.context().cookies();
    const hasAuthCookie = cookies.some(
      (cookie) =>
        cookie.name.includes("better-auth") ||
        cookie.name.includes("session") ||
        cookie.name.includes("auth"),
    );
    expect(hasAuthCookie).toBeFalsy();

    await page.goto("/account");
    await expect(page).toHaveURL("/sign-in");
  });

  test("should persist session after browser refresh", async ({
    page,
    authPage,
  }) => {
    await authPage.signIn({
      email: testUser.email,
      password: testUser.password,
      rememberMe: true,
    });

    await page.waitForURL("/", { timeout: 10000 });

    await page.reload();

    expect(await isAuthenticated(page)).toBeTruthy();

    const cookiesAfter = await page.context().cookies();
    const authCookie = cookiesAfter.find(
      (cookie) =>
        cookie.name.includes("better-auth") ||
        cookie.name.includes("session") ||
        cookie.name.includes("auth"),
    );
    expect(authCookie).toBeDefined();
  });

  test("should show user information when authenticated", async ({
    page,
    authPage,
  }) => {
    await page.goto("/sign-in?callbackUrl=%2Faccount");
    await authPage.fillSignInForm({
      email: testUser.email,
      password: testUser.password,
    });
    await authPage.submitSignInForm();

    await page.waitForURL("/account", { timeout: 10000 });

    await expect(page.getByText(testUser.name).first()).toBeVisible();
    await expect(page.getByText(testUser.email).first()).toBeVisible();
  });

  test("should handle session timeout gracefully", async ({
    page,
    authPage,
  }) => {
    await authPage.signIn({
      email: testUser.email,
      password: testUser.password,
    });

    await page.waitForURL("/", { timeout: 10000 });

    await page.context().clearCookies();

    await page.goto("/account");
    await expect(page).toHaveURL("/sign-in");
  });
});
