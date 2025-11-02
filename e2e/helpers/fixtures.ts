import { test as base } from "@playwright/test";
import { AuthPage } from "./auth-helpers";

type AuthFixtures = {
  authPage: AuthPage;
};

export const test = base.extend<AuthFixtures>({
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },
});

export { expect } from "@playwright/test";
