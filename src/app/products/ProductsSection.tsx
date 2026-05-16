import { readFileSync } from "fs";
import { join } from "path";
import { ProductsGrid } from "./ProductsGrid";

interface Product {
  id: string;
  name: string;
  sku: string;
  price_range: {
    minimum_price: {
      final_price: {
        value: number;
        currency: string;
      };
    };
    maximum_price: {
      final_price: {
        value: number;
        currency: string;
      };
    };
  };
  small_image: {
    url: string;
    label: string;
  };
  url_key?: string;
  type_id?: string;
}

interface ProductsResponse {
  products: {
    items: Product[];
    total_count: number;
    page_info: {
      current_page: number;
      page_size: number;
      total_pages: number;
    };
  };
}

async function fetchProducts(
  pageSize: number = 20,
  currentPage: number = 1,
): Promise<ProductsResponse | null> {
  try {
    const queryPath = join(
      process.cwd(),
      "src",
      "app",
      "qraphql",
      "query",
      "test.graphql"
    );
    const query = readFileSync(queryPath, "utf8");

    const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { pageSize, currentPage, search: "а" } }),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return null;
  }
}

export async function ProductsSection() {
  const data = await fetchProducts(20, 1);

  if (!data) {
    return (
      <p className="text-red-500">
        Failed to load products. Please try again later.
      </p>
    );
  }

  const { items: products, total_count, page_info } = data.products;

  return (
    <ProductsGrid
      products={products}
      total_count={total_count}
      page_info={page_info}
    />
  );
}
