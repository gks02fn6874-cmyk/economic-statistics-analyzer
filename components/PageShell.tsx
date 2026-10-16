import type { ReactNode } from "react";
import Reveal from "./Reveal";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/** 안내용 하위 페이지의 공통 틀: 고정 메뉴 + 큰 제목 + 흰 카드 본문 + 푸터 */
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
      <SiteHeader />
      <div className="mx-auto w-full max-w-3xl px-6 pt-14 pb-8">
        <Reveal>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">{title}</h1>
          {lead && <p className="mt-4 text-lg leading-relaxed text-zinc-500">{lead}</p>}
        </Reveal>
      </div>
      <main className="mx-auto w-full max-w-3xl px-6">
        <Reveal delay={80}>
          <div className="rounded-[28px] bg-white p-6 sm:p-10">{children}</div>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
