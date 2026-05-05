import { useAuth } from "../context/AuthContext";
import { GymAdminPage } from "./GymAdminPage";

export const PanelPage = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "GYM_MANAGER") {
    return <GymAdminPage />;
  }

  return <div className="text-white text-center mt-10">Na razie brak</div>;
};
