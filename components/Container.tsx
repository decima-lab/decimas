export default function Container({ children }: { children: React.ReactNode }) {
  return <div className="p-20 flex flex-col gap-4">{children}</div>;
}
