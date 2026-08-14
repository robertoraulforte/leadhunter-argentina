import { requireCrmAuth } from "@/lib/crm-auth";
import CrmClient from "./CrmClient";

export default async function CrmPage() {
  await requireCrmAuth();

  return <CrmClient />;
}
