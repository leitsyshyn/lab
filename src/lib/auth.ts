import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import Stripe from "stripe";
import { reactResetPasswordEmail } from "@/components/auth/emails/reset-password-email";
import { reactVerifyEmailEmail } from "@/components/auth/emails/verification-email";

import { db } from "@/db/drizzle";
import * as schema from "@/db/schema/auth";
import { resend } from "./email";

const stripeClient = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
  {
    apiVersion: "2025-09-30.clover",
  },
);

const isTestMode =
  process.env.NODE_ENV === "test" || process.env.PLAYWRIGHT_TEST === "true";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: !isTestMode,
    async sendResetPassword({ user, url }) {
      if (isTestMode) {
        console.log(`[TEST MODE] Password reset link: ${url}`);
        return;
      }
      await resend.emails.send({
        from: process.env.BETTER_AUTH_EMAIL_FROM as string,
        to: user.email,
        subject: "Reset your password",
        react: reactResetPasswordEmail({ username: user.name, resetLink: url }),
      });
    },
  },
  emailVerification: {
    sendOnSignIn: !isTestMode,
    sendOnSignUp: !isTestMode,
    async sendVerificationEmail({ user, url }) {
      if (isTestMode) {
        console.log(`[TEST MODE] Email verification link: ${url}`);
        return;
      }
      await resend.emails.send({
        from: process.env.BETTER_AUTH_EMAIL_FROM as string,
        to: user.email,
        subject: "Verify your email address",
        react: reactVerifyEmailEmail({
          username: user.name,
          verificationLink: url,
        }),
      });
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github"],
    },
  },
  plugins: [
    organization({
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
        await resend.emails.send({
          from: process.env.BETTER_AUTH_EMAIL_FROM as string,
          to: data.email,
          subject: `You've been invited to join ${data.organization.name}`,
          html: `
            <h1>Organization Invitation</h1>
            <p>Hi there!</p>
            <p><strong>${data.inviter.user.name}</strong> (${data.inviter.user.email}) has invited you to join <strong>${data.organization.name}</strong>.</p>
            <p>Click the link below to accept the invitation:</p>
            <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${inviteLink}</p>
            <p>This invitation will expire on ${new Date(data.invitation.expiresAt).toLocaleDateString()}.</p>
          `,
        });
      },
    }),
    stripe({
      stripeClient,
      stripeWebhookSecret:
        process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder",
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "free",
            priceId: "price_free",
          },
          {
            name: "plus",
            priceId: process.env.STRIPE_PLUS_PRICE_ID || "price_plus",
          },
          {
            name: "enterprise",
            priceId:
              process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
          },
        ],
      },
    }),
  ],
});
