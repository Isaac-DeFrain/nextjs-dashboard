import { Metadata } from "next";
import { Suspense } from "react";
import { fetchCustomersPages } from "@/app/lib/data";
import { lusitana } from "@/app/ui/fonts";
import Search from "@/app/ui/search";
import Table from "@/app/ui/customers/table";
import { CustomersTableSkeleton } from "@/app/ui/skeletons";
import Pagination from "@/app/ui/invoices/pagination";

export const metadata: Metadata = {
  title: "Customers",
};

type CustomersPageProps = {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
};

export default async function Page({ searchParams }: CustomersPageProps) {
  const params = (await searchParams) ?? {};
  const query = params.query || "";
  const currentPage = Number(params.page) || 1;
  const totalPages = await fetchCustomersPages(query);

  return (
    <div className="w-full">
      <h1 className={`${lusitana.className} mb-8 text-xl md:text-2xl`}>
        Customers
      </h1>
      <Search placeholder="Search customers" />
      <div className="w-full">
        <Suspense
          key={query + currentPage}
          fallback={<CustomersTableSkeleton />}
        >
          <Table query={query} currentPage={currentPage} />
        </Suspense>
        <div className="mt-5 flex w-full justify-center">
          {totalPages > 1 && <Pagination totalPages={totalPages} />}
        </div>
      </div>
    </div>
  );
}
