import { redirect } from "next/navigation";

// On this branch the app opens in the CRM: its own sign-in page shows until the visitor is signed in.
export default function Home() {
  redirect("/crm/dashboard");
}
