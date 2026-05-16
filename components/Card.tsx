import Image from "next/image";

export default function Card() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 flex flex-row gap-4">
      <div className="shrink-0">
        <Image 
        src="https://picsum.photos/200/300?grayscale" 
        className="size-32 object-cover rounded"
        alt="Card Image" width={200} height={200} />
      </div>
      <div className="flex flex-col gap-2 justify-between">
        <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Sed, voluptas.

        </p>
        <small>Added on January 1, 2023</small>
      </div>

    </div>
  );
}
