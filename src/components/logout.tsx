import { ConfirmDialog } from "@/components/confirm-dialog";

export function LogoutButton({ handleLogout }: { handleLogout: () => void }) {
  return (
    <ConfirmDialog
      trigger={
        <button
          className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
        >
          Logout
        </button>
      }
      title="Are you sure you want to logout?"
      description="You will be signed out of your account."
      confirmText="Logout"
      cancelText="Cancel"
      onConfirm={handleLogout}
    />
  );
}
