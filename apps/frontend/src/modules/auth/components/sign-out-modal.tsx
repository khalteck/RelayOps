import { App, Modal } from "antd";
import { useLogout } from "../operations/auth.queries";

const SAFE_LOGOUT_ERROR = "We couldn’t sign you out. Please try again.";

interface SignOutModalProps {
  open: boolean;
  onCancel: () => void;
  onSignedOut: () => void | Promise<void>;
}

export function SignOutModal({ open, onCancel, onSignedOut }: SignOutModalProps) {
  const { message } = App.useApp();
  const logout = useLogout();

  const signOut = async () => {
    try {
      await logout.mutateAsync();
      await onSignedOut();
    } catch {
      // Authentication failures can contain operational context intended only
      // for server logs. The account-facing message is intentionally generic.
      void message.error(SAFE_LOGOUT_ERROR);
    }
  };

  return (
    <Modal
      title="Sign out of RelayOps?"
      open={open}
      okText="Sign out"
      okButtonProps={{ danger: true }}
      confirmLoading={logout.isPending}
      onOk={() => void signOut()}
      onCancel={onCancel}
    >
      <p>You will need to sign in again to access your organisations and workspaces.</p>
    </Modal>
  );
}
