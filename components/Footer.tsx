import Logo from './Logo'

export default function Footer() {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} <Logo />. All rights reserved.
        </p>
      </div>
    </div>
  )
}
