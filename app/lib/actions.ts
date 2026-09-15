"use server";

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_PRISMA_DATABASE_URL!, {
  ssl: "require",
});

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({ invalid_type_error: "Please select a customer." }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

const CreateInvoiceSchema = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
  values?: {
    customerId?: string;
    amount?: string;
    status?: string;
  };
};

export async function createInvoice(_prevState: State, formData: FormData) {
  const rawFormData = {
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  };

  // Validate the data
  const data = CreateInvoiceSchema.safeParse(rawFormData);
  if (!data.success) {
    const errors = data.error.flatten().fieldErrors;
    return {
      errors,
      message: `Missing required fields. Failed to create invoice.`,
      values: {
        customerId: String(rawFormData.customerId ?? ""),
        amount: String(rawFormData.amount ?? ""),
        status: String(rawFormData.status ?? ""),
      },
    };
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
    return { message: "Database Error: Failed to create invoice" };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

const UpdateInvoiceSchema = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const rawFormData = {
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  };

  // Validate the data
  const data = UpdateInvoiceSchema.safeParse(rawFormData);
  if (!data.success) {
    const errors = data.error.flatten().fieldErrors;
    console.error("Validation error:", errors);
    throw new Error("Invalid form data");
  }

  // Prepare the data for update
  const { customerId, amount, status } = data.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  // Update the data in the database
  try {
    await sql`UPDATE invoices
              SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}, date = ${date}
              WHERE id = ${id}
            `;
  } catch (error) {
    console.error("Failed to update invoice:", error);
    throw new Error("Database Error: Failed to update invoice");
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    throw new Error("Database Error: Failed to delete invoice");
  }

  revalidatePath("/dashboard/invoices");
}
