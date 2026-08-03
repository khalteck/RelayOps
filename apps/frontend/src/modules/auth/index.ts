export { ProtectedRoute } from "./components/protected-route";
export {
  useLogin,
  useLogout,
  useRegister,
  useSession,
  useUpdateProfile
} from "./operations/auth.queries";

export const loadLoginView = () => import("./views/login.view");
export const loadRegisterView = () => import("./views/register.view");
export const loadAcceptInviteView = () => import("./views/accept-invite.view");
