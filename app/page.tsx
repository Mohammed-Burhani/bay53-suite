import { redirect } from "next/navigation";

export default function Home() {
  // DEMO BRANCH: land on CRM dashboard instead of /login
  redirect("/crm/dashboard");
}
