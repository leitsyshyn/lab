import { eq } from "drizzle-orm";
import { dedupe, flag } from "flags/next";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { subscription, user } from "@/db/schema/auth";
import { auth } from "@/lib/auth";

const getUserSubscription = dedupe(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { hasPlusPlan: false, user: null };
    }

    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userRecord.length || !userRecord[0].stripeCustomerId) {
      console.log("No Stripe customer ID found for user:", session.user.id);
      return { hasPlusPlan: false, user: session.user };
    }

    const userSubscription = await db
      .select()
      .from(subscription)
      .where(eq(subscription.stripeCustomerId, userRecord[0].stripeCustomerId))
      .limit(1);

    console.log("User subscription query result:", {
      userId: session.user.id,
      stripeCustomerId: userRecord[0].stripeCustomerId,
      subscription: userSubscription[0],
    });

    const hasPlusPlan =
      userSubscription.length > 0 &&
      userSubscription[0].plan === "plus" &&
      userSubscription[0].status === "active";

    return {
      hasPlusPlan,
      user: session.user,
      subscription: userSubscription[0] || null,
    };
  } catch (error) {
    console.error("Error getting user subscription:", error);
    return { hasPlusPlan: false, user: null };
  }
});

export const plusPlanFeatureFlag = flag<boolean>({
  key: "plus-plan-feature",
  description: "Enables premium features for users with a plus plan",
  defaultValue: false,
  options: [
    { value: false, label: "Disabled" },
    { value: true, label: "Enabled" },
  ],
  async decide() {
    const { hasPlusPlan } = await getUserSubscription();
    return hasPlusPlan;
  },
});

export const allFlags = {
  plusPlanFeatureFlag,
};
