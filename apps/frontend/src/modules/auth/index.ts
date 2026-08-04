export { ProtectedRoute } from "./components/protected-route";
export { SignOutModal } from "./components/sign-out-modal";
export {
  useLogin,
  useLogout,
  useRegister,
  useStartRegistration,
  useVerifyRegistration,
  useResendRegistration,
  useCompleteOwnerOnboarding,
  useCompleteInvitedOnboarding,
  useSession,
  useUpdateProfile,
  useUpdatePreferences
} from "./operations/auth.queries";

export const loadLoginView = () => import("./views/login.view");
export const loadRegisterView = () => import("./views/register.view");
export const loadAcceptInviteView = () => import("./views/accept-invite.view");
export const loadVerifyEmailView = () => import("./views/verify-email.view");
export const loadOwnerOnboardingView = () => import("./views/owner-onboarding.view");
export const loadInvitedOnboardingView = () => import("./views/invited-onboarding.view");
