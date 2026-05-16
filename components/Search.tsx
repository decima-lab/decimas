import Button from "./Button";

export default function Search() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-md mb-15 bg-gray-100 dark:bg-gray-900">
      <input
        type="text"
        placeholder="Search..."
        className="flex-1 p-2 border border-gray-100 rounded-md"
      />
      <Button />
    </div>
  );
}
