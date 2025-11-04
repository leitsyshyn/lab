export default function ChartsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="container mx-auto p-6 max-w-5xl">{children}</div>;
}
