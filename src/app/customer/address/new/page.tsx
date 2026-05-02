import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AddressFormPage } from "@/src/app/components/Profile/AddressFormPage";

export default async function NewAddressPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) redirect("/");

  return <AddressFormPage title="Добави нов адрес" />;
}
