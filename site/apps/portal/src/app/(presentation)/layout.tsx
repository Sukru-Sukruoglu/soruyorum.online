export default function PresentationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full bg-[#0a051d]">
            <style>{`
                @keyframes viewFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
            {children}
        </div>
    );
}
