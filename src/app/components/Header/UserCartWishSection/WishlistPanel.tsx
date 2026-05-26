// TO DO CURRENTLY MAGENTO 2.3 DOESNT SUPPORT IT
// "use client";

// import MagentoImage from "@/src/app/components/MagentoImage";
// import Link from "next/link";
// import { useWishlist } from "@/src/app/contexts/WishlistContext";
// import { magentoImageUrl } from "@/src/app/utils/image";

// export const WishlistPanel = () => {
//   const { wishlist, itemCount, loading } = useWishlist();

//   if (loading) return <p className="text-gray-500 text-sm">Зареждане...</p>;

//   if (!wishlist || itemCount === 0)
//     return <p className="text-gray-500 text-sm">Нямате любими продукти.</p>;

//   return (
//     <ul className="flex flex-col gap-4">
//       {wishlist.items.filter((item) => item.product).map((item) => {
//         const price = item.product.price_range.minimum_price.final_price;
//         return (
//           <li key={item.id} className="flex gap-3">
//             <Link
//               href={`/${item.product.url_key}`}
//               className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-100"
//             >
//               <MagentoImage
//                 src={magentoImageUrl(item.product.thumbnail.url)}
//                 alt={item.product.thumbnail.label || item.product.name}
//                 fill
//                 className="object-contain"
//               />
//             </Link>
//             <div className="flex-1 min-w-0">
//               <Link
//                 href={`/${item.product.url_key}`}
//                 className="text-sm font-medium text-brand-nav line-clamp-2 hover:underline"
//               >
//                 {item.product.name}
//               </Link>
//               <p className="text-xs text-gray-500 mt-1">
//                 {price.value.toFixed(2)} {price.currency}
//               </p>
//             </div>
//           </li>
//         );
//       })}
//     </ul>
//   );
// };
export {};
