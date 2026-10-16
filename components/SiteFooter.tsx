export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-zinc-300/70 bg-[#f5f5f7] py-8 text-xs leading-relaxed text-zinc-500">
      <div className="mx-auto w-full max-w-6xl px-6">
        <p className="font-semibold text-zinc-700">Economic Statistics Analyzer</p>
        <p className="mt-1">
          KOSIS 국가통계포털 등에서 내려받은 공개 통계 엑셀 파일을 분석하는 별도의 도구이며,
          KOSIS·통계청의 공식 서비스가 아닙니다. 올린 파일과 계산 결과는 서버에 저장되지 않습니다.
        </p>
      </div>
    </footer>
  );
}
