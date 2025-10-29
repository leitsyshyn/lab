"use client";

import { Crown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { authClient } from "@/lib/auth-client";

const PLANS = [
  {
    name: "plus",
    displayName: "Plus",
    description: "For professionals and teams",
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    description: "Custom solutions for large organizations",
  },
] as const;

export function SubscriptionDialog() {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = async (planName: string) => {
    if (planName === "enterprise") {
      setOpen(false);
      toast.info("Please contact our sales team for Enterprise pricing");
      window.location.href =
        "mailto:sales@example.com?subject=Enterprise Plan Inquiry";
      return;
    }

    setIsProcessing(true);
    try {
      await authClient.subscription.upgrade({
        plan: planName,
        successUrl: `${window.location.origin}/account?upgraded=true`,
        cancelUrl: `${window.location.origin}/account`,
      });
      // The redirect happens automatically
    } catch (error) {
      toast.error("Failed to start checkout");
      console.error(error);
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Crown className="h-4 w-4" />
          Upgrade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            Choose a plan to get started with premium features
          </DialogDescription>
        </DialogHeader>
        <ItemGroup className="gap-3 py-4">
          {PLANS.map((plan) => (
            <Item key={plan.name} variant="outline">
              <ItemContent>
                <ItemTitle>{plan.displayName}</ItemTitle>
                <ItemDescription>{plan.description}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleSelectPlan(plan.name)}
                >
                  {isProcessing
                    ? "Processing..."
                    : plan.name === "enterprise"
                      ? "Contact Sales"
                      : "Select"}
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </DialogContent>
    </Dialog>
  );
}
