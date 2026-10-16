import AnalyzeView from "@/components/AnalyzeView";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "분석 결과 | Economic Statistics Analyzer",
};

export default function AnalyzePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <AnalyzeView />
      </main>
      <SiteFooter />
    </>
  );
}
