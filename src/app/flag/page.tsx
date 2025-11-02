import { redirect } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { plusPlanFeatureFlag } from "@/lib/flags";

export default async function PlusFeaturesPage() {
  const hasPlusAccess = await plusPlanFeatureFlag();

  if (!hasPlusAccess) {
    redirect("/account");
  }

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle>Thank you for being a Plus member!</CardTitle>
        <CardDescription>
          This page demonstrates the Vercel feature flags implementation. Only
          users with an active Plus plan subscription can access this page. The
          feature flag checks your subscription status in real-time.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
