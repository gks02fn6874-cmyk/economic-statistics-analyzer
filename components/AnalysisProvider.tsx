"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * 첫 화면에서 고른 엑셀 파일을 /analyze 페이지로 넘기기 위한 보관함.
 * 파일은 이 브라우저 탭의 메모리에만 있고 서버나 저장소에는 저장되지 않는다.
 * 새로 고침하면 사라지므로, 그때는 첫 화면에서 다시 올리면 된다.
 */
type Store = { file: File | null; setFile: (file: File | null) => void };

const Ctx = createContext<Store>({ file: null, setFile: () => {} });

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const value = useMemo(() => ({ file, setFile }), [file]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAnalysisFile = () => useContext(Ctx);
