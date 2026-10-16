import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Pretendard (SIL OFL 1.1) 가변 글꼴. 외부 서버 없이 이 프로젝트 안의 파일로 불러온다.
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: "경제통계 종합분석 프로그램",
  description: "엑셀 경제통계 자료의 증감률·이동평균·성장 기여도·상관관계를 자동 계산합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
