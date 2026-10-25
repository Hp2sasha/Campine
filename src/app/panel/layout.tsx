export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="print-area">{children}</div>;
}
