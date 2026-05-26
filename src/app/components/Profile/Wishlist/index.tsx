// TO DO CURRENTLY MAGENTO 2.3 DOESNT SUPPORT IT
// "use client";

// import MagentoImage from "@/src/app/components/MagentoImage";
// import Link from "next/link";
// import { useWishlist } from "@/src/app/contexts/WishlistContext";
// import { magentoImageUrl } from "@/src/app/utils/image";

// export const ProfileWishlist = () => {
//   const { wishlist, itemCount, loading } = useWishlist();

//   if (loading) return <p className="text-gray-500 text-sm">Зареждане...</p>;

//   if (!wishlist || itemCount === 0)
//     return <p className="text-gray-400 text-sm">Нямате любими продукти.</p>;

//   return (
//     <div>
//       <h2 className="text-lg font-semibold text-brand-nav mb-6">Любими стоки</h2>
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//         {wishlist.items.filter((item) => item.product).map((item) => {
//           const price = item.product.price_range.minimum_price.final_price;
//           return (
//             <div key={item.id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
//               <Link href={`/${item.product.url_key}`} className="relative w-full aspect-square rounded-lg overflow-hidden block">
//                 <MagentoImage
//                   src={magentoImageUrl(item.product.thumbnail.url)}
//                   alt={item.product.thumbnail.label || item.product.name}
//                   fill
//                   className="object-contain"
//                 />
//               </Link>
//               <div className="flex-1">
//                 <Link
//                   href={`/${item.product.url_key}`}
//                   className="text-sm font-medium text-brand-nav line-clamp-2 hover:underline"
//                 >
//                   {item.product.name}
//                 </Link>
//                 <p className="text-brand-action font-semibold text-sm mt-1">
//                   {price.value.toFixed(2)} {price.currency}
//                 </p>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };
export {};
