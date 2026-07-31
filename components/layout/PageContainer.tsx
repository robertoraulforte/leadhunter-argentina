import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

type Props = {
  children: ReactNode;
};

export default function PageContainer({ children }: Props) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <TopBar />

        <main className="p-6 bg-slate-100 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}