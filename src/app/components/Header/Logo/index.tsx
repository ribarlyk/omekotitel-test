import Link from "next/link";
import Image from "next/image";

export const Logo = ({ imgClassName }: { imgClassName?: string } = {}) => {
  return (
    <div className="logo">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/assets/omekotitel-bg_1.avif"
          alt="Омекотител лого"
          width={190}
          height={90}
          loading="eager"
          fetchPriority="high"
          sizes="(max-width: 1024px) 130px, 190px"
          className={imgClassName ?? "w-32.5 h-auto lg:w-47.5"}
        />
      </Link>
    </div>
  );
};
