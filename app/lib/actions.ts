"use server";

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoiceSchema = FormSchema.omit({ id: true, date: true });

const sql = postgres(process.env.POSTGRES_PRISMA_DATABASE_URL!, {
  ssl: "require",
});

export async function createInvoice(formData: FormData) {
  const rawFormData = {
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  };

  // Validate the data
  const data = CreateInvoiceSchema.safeParse(rawFormData);
  if (!data.success) {
    const errors = data.error.flatten().fieldErrors;
    console.log("Validation error:", errors);
    return;
  }

  // Prepare the data for insertion
  const { customerId, amount, status } = data.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  // Insert the data into the database
  try {
    await sql`
          INSERT INTO invoices (customer_id, amount, status, date)
          VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return;
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
