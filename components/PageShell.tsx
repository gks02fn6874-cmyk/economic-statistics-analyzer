import type { ReactNode } from "react";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/** 안내용 하위 페이지의 공통 틀: 청록 상단 영역 + 제목 + 본문 + 푸터 */
export default function PageShell({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className="hero-gradient">
        <SiteHeader />
        <div className="mx-auto w-full max-w-6xl px-6 pt-6 pb-10 text-white">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {lead && <p className="mt-2 text-sm opacity-90">{lead}</p>}
        </div>
      </div>
      <main className="mx-auto w-full max-w-3xl px-6 py-10">{children}</main>
      <SiteFooter />
    </>
  );
}
