import Logo from "./Logo";

export default function Header() {  
  return (
    <header className="w-full flex items-center justify-between p-4 bg-white dark:bg-black">
      <Logo variant={"link"} />
    </header>
  );
}
