import IngreviaLoader from "@/components/IngreviaLoader";
import { useI18n } from "@/lib/i18n";

export default function LoadingScreen({ message }) {
  const { t } = useI18n();
  return <IngreviaLoader message={message || t("loading.default")} fullScreen />;
}
