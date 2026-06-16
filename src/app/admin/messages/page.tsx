"use client";

import { MessengerPanel } from "@/components/admin/dashboard/MessengerPanel";
import { PageHeader } from "@/components/admin/shared/PageHeader";

export default function AdminMessagesPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Messages"
        description="Manage all visitor conversations in one place"
      />
      <MessengerPanel fullPage />
    </div>
  );
}
