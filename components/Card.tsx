import Image from "next/image";
import { CheckCircle2, Globe } from "lucide-react";

export default function Card() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-zinc-700">
      <div className="flex items-start justify-between mb-4">
        <div className="shrink-0">
          <Image 
            src="https://picsum.photos/64/64?random" 
            className="size-14 object-cover rounded-lg"
            alt="Platform" 
            width={64} 
            height={64} 
          />
        </div>
        <div className="flex gap-2">
          <CheckCircle2 className="size-5 text-green-500" />
          <Globe className="size-5 text-blue-500" />
        </div>
      </div>
      <h3 className="font-semibold text-lg mb-2">Earning Platform</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
        Start earning money online with this verified platform. Complete tasks, surveys, and other activities to grow your income.
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">Added on January 1, 2023</span>
        <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
          Learn More →
        </button>
      </div>
    </div>
  );
}
