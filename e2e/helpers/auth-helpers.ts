import type { Page } from "@playwright/test";

export function generateTestUser() {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `test-${timestamp}@example.com`,
    password: "TestPassword123!",
  };
}

export class AuthPage {
  constructor(private page: Page) {}

  async gotoSignIn() {
    await this.page.goto("/sign-in");
  }

  async gotoSignUp() {
    await this.page.goto("/sign-up");
  }

  async gotoForgotPassword() {
    await this.page.goto("/forgot-password");
  }

  async fillSignUpForm(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }) {
    await this.page.fill("#sign-up-name", data.name);
    await this.page.fill("#sign-up-email", data.email);
    await this.page.fill("#sign-up-password", data.password);
    await this.page.fill(
      "#sign-up-confirm-password",
      data.confirmPassword || data.password,
    );
  }

  async submitSignUpForm() {
    await this.page.click('button[type="submit"][form="sign-up-form"]');
  }

  async signUp(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }) {
    await this.gotoSignUp();
    await this.fillSignUpForm(data);
    await this.submitSignUpForm();
  }

  async fillSignInForm(data: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) {
    await this.page.fill("#sign-in-email", data.email);
    await this.page.fill("#sign-in-password", data.password);
    if (data.rememberMe) {
      await this.page.check("#remember-me");
    }
  }

  async submitSignInForm() {
    await this.page.click('button[type="submit"][form="sign-in-form"]');
  }

  async signIn(data: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) {
    await this.gotoSignIn();
    await this.fillSignInForm(data);
    await this.submitSignInForm();
  }

  async fillForgotPasswordForm(email: string) {
    await this.page.fill("#forgot-password-email", email);
  }

  async submitForgotPasswordForm() {
    await this.page.click('button[type="submit"][form="forgot-password-form"]');
  }

  async requestPasswordReset(email: string) {
    await this.gotoForgotPassword();
    await this.fillForgotPasswordForm(email);
    await this.submitForgotPasswordForm();
  }

  async signOut() {
    const signOutButton = this.page.getByRole("button", {
      name: /sign out/i,
    });
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
    }
  }

  async getFieldError(fieldId: string): Promise<string | null> {
    const field = this.page.locator(`#${fieldId}`).locator("..");
    const error = field.locator('[role="alert"], .text-destructive');
    if (await error.isVisible()) {
      return error.textContent();
    }
    return null;
  }

  async hasFieldError(fieldId: string): Promise<boolean> {
    const field = this.page.locator(`#${fieldId}`).locator("..");
    return field.locator('[data-invalid="true"]').isVisible();
  }

  async clickGitHubSignIn() {
    await this.page.click('button:has-text("Sign in with GitHub")');
  }

  async waitForAuthSuccess() {
    await this.page.waitForURL("/", { timeout: 10000 });
  }

  async waitForAccountPage() {
    await this.page.waitForURL("/account", { timeout: 10000 });
  }
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    const cookies = await page.context().cookies();
    const hasAuthCookie = cookies.some(
      (cookie) =>
        cookie.name.includes("better-auth") ||
        cookie.name.includes("session") ||
        cookie.name.includes("auth"),
    );
    return hasAuthCookie;
  } catch {
    return false;
  }
}

export async function clearAuthState(page: Page) {
  await page.context().clearCookies();

  try {
    const url = page.url();
    if (url && !url.startsWith("about:")) {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    }
  } catch {}
}

export async function waitForToast(
  page: Page,
  expectedText?: string,
): Promise<string | null> {
  try {
    const toast = page.locator("[data-sonner-toast]").first();
    await toast.waitFor({ state: "visible", timeout: 5000 });
    const text = await toast.textContent();
    if (expectedText && text) {
      if (!text.includes(expectedText)) {
        throw new Error(
          `Expected toast with text "${expectedText}" but got "${text}"`,
        );
      }
    }
    return text;
  } catch (error) {
    if (expectedText) {
      throw error;
    }
    return null;
  }
}

export async function hasToastType(
  page: Page,
  type: "success" | "error" | "info" | "warning",
): Promise<boolean> {
  const toast = page.locator(`[data-sonner-toast][data-type="${type}"]`);
  return toast.isVisible();
}
