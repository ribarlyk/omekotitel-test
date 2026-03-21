import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { UserCartWishSection } from "./UserCartWishSection";

export const Header = () => {
  return (
    <header className="hidden lg:block w-full px-4 py-4 lg:px-6 bg-white z-30">
      {/* Top row: logo + search + icons */}
      <div className="flex items-center w-full">
        <div className="shrink-0">
          <Logo />
        </div>
        {/* Search centered in remaining space */}
        <div className="hidden lg:flex flex-1 justify-center px-8">
          <div className="w-full max-w-xl">
            <SearchBar />
          </div>
        </div>
        <div className="shrink-0 ml-auto lg:ml-0">
          <UserCartWishSection />
        </div>
      </div>
      {/* Search bar full width on mobile/tablet */}
      <div className="mt-3 lg:hidden">
        <SearchBar />
      </div>
    </header>
  );
};
