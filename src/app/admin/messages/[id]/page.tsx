"use client";

import { useParams } from "next/navigation";
import { MessengerPanel } from "@/components/admin/dashboard/MessengerPanel";

export default function ConversationPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="p-6 space-y-6">
      <MessengerPanel fullPage initialConversationId={id} />
    </div>
  );
}
