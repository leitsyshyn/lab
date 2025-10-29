import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface BetterAuthVerificationEmailProps {
  username?: string;
  verificationLink?: string;
}

export const VerificationEmail = ({
  username,
  verificationLink,
}: BetterAuthVerificationEmailProps) => {
  const previewText = `Verify your Better Auth email address`;
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-wite my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-10 mx-auto p-5 max-w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Verify your <strong>Better Auth</strong> email address
            </Heading>
            <Text className="text-black text-[14px] leading-6">
              Hello {username},
            </Text>
            <Text className="text-black text-[14px] leading-6">
              We received a request to verify your email address for your Better
              Auth account. If you didn't make this request, you can safely
              ignore this email.
            </Text>
            <Section className="text-center mt-8 mb-8">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={verificationLink}
              >
                Verify Email
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-6">
              Or copy and paste this URL into your browser:{" "}
              <Link
                href={verificationLink}
                className="text-blue-600 no-underline"
              >
                {verificationLink}
              </Link>
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-6">
              If you didn't request a email verification, please ignore this
              email or contact support if you have concerns.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export function reactVerifyEmailEmail(props: BetterAuthVerificationEmailProps) {
  console.log(props);
  return <VerificationEmail {...props} />;
}
