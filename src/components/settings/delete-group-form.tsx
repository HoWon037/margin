"use client";

import { deleteGroupAction } from "@/app/actions";
import { ConfirmActionDialog } from "@/components/ui/modal";

interface DeleteGroupFormProps {
  groupId: string;
}

export function DeleteGroupForm({ groupId }: DeleteGroupFormProps) {
  return (
    <ConfirmActionDialog
      action={deleteGroupAction}
      confirmLabel="모임 삭제"
      description="모임, 책, 기록, 멤버 정보가 모두 삭제되며 되돌릴 수 없습니다."
      fields={{ groupId }}
      title="정말 이 모임을 삭제할까요?"
      triggerLabel="모임 삭제"
    />
  );
}
