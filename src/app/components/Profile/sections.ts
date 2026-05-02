export enum ProfileSection {
  Dashboard = "dashboard",
  Addresses = "addresses",
  Details = "details",
  Orders = "orders",
  Downloads = "downloads",
  Newsletter = "newsletter",
  Payments = "payments",
  Reviews = "reviews",
  Wishlist = "wishlist",
}

export const SECTION_LABELS: Record<ProfileSection, string> = {
  [ProfileSection.Dashboard]: "Табло за управление на профила",
  [ProfileSection.Addresses]: "Адресна книга",
  [ProfileSection.Details]: "Информация за профила",
  [ProfileSection.Orders]: "Моите поръчки",
  [ProfileSection.Downloads]: "Моите продукти за сваляне",
  [ProfileSection.Newsletter]: "Абонамент за бюлетин",
  [ProfileSection.Payments]: "Съхранени методи за плащане",
  [ProfileSection.Reviews]: "Моите отзиви за продукти",
  [ProfileSection.Wishlist]: "Моят списък с желани",
};
