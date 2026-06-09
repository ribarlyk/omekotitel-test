"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { trackSearch } from "@/src/app/utils/analytics";

export const SearchBar = ({ inputRef }: { inputRef?: React.RefObject<HTMLInputElement | null> } = {}) => {
  const [value, setValue] = useState("");
  const router = useRouter();

  const debouncedNavigateRef = useRef(
    debounce((q: string) => {
      if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }, 300)
  );

  useEffect(() => () => debouncedNavigateRef.current.cancel(), []);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    debouncedNavigateRef.current.cancel();
    if (value.trim()) {
      trackSearch(value.trim());
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <form
      className="flex items-center w-full h-full lg:h-14 border border-gray-300 rounded-lg px-3 lg:px-4 gap-2"
      onSubmit={handleSubmit}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Търсене на продукти..."
        className="flex-1 outline-none bg-transparent"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        maxLength={200}
      />
      <button
        type="submit"
        aria-label="Търси"
        className="p-2 rounded-lg hover:bg-brand-nav transition-colors duration-200 group cursor-pointer"
      >
        <Search
          className="text-brand-action group-hover:text-white"
          size={20}
          strokeWidth={2}
        />
      </button>
    </form>
  );
};
