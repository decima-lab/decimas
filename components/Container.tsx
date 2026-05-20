export default function Container({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-20 md:p-30 flex flex-col gap-4">{children}</div>;
}
