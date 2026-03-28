import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/" className="text-brand-nav font-bold text-lg tracking-tight">
            omekotitel
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand-action/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-9 h-9 text-brand-action" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Поръчката е приета!
          </h1>

          {order && (
            <p className="text-gray-500 text-sm mb-1">
              Номер на поръчка:{" "}
              <span className="font-semibold text-gray-800">#{order}</span>
            </p>
          )}

          <p className="text-gray-400 text-sm mb-8">
            Ще получите имейл потвърждение скоро. Благодарим ви!
          </p>

          <Link
            href="/"
            className="inline-flex items-center justify-center bg-brand-action hover:bg-brand-action-light text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm shadow-sm"
          >
            Продължи пазаруването
          </Link>
        </div>
      </div>
    </div>
  );
}
