"use client";

import { deleteGroupAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

interface DeleteGroupFormProps {
  groupId: string;
}

export function DeleteGroupForm({ groupId }: DeleteGroupFormProps) {
  return (
    <form
      action={deleteGroupAction}
      onSubmit={(event) => {
        if (!window.confirm("정말 이 모임을 삭제하시겠습니까?")) {
          event.preventDefault();
        }
      }}
    >
      <input name="groupId" type="hidden" value={groupId} />
      <Button type="submit" variant="danger">
        모임 삭제
      </Button>
    </form>
  );
}
