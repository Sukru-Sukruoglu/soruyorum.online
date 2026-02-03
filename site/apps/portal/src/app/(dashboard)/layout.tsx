import { Sidebar } from "../../components/layout/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-[#F8F8F8] min-h-screen">
            <Sidebar />
            <main className="pl-[280px] min-h-screen transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
