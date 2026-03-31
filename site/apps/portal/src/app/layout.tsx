import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
    subsets: ["latin"],
    variable: "--font-montserrat"
});

export const metadata: Metadata = {
    title: "SoruYorum Portal",
    description: "Organizasyon Yönetim Paneli",
    icons: {
        icon: [
            { url: "/assets/images/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/assets/images/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        ],
        apple: "/assets/images/favicons/apple-touch-icon.png",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

import Providers from "./providers";
import { VisitorTracker } from "../components/VisitorTracker";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr" suppressHydrationWarning>
            <head>
                {/* Stylesheets */}
                <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Marcellus&display=swap" rel="stylesheet" />

                <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
                <link rel="stylesheet" href="/assets/css/animate.min.css" />
                <link rel="stylesheet" href="/assets/css/custom-animate.css" />
                <link rel="stylesheet" href="/assets/css/swiper.min.css" />
                <link rel="stylesheet" href="/assets/css/font-awesome-all.css" />
                <link rel="stylesheet" href="/assets/css/jarallax.css" />
                <link rel="stylesheet" href="/assets/css/jquery.magnific-popup.css" />
                <link rel="stylesheet" href="/assets/css/odometer.min.css" />
                <link rel="stylesheet" href="/assets/css/flaticon.css" />
                <link rel="stylesheet" href="/assets/css/owl.carousel.min.css" />
                <link rel="stylesheet" href="/assets/css/owl.theme.default.min.css" />
                <link rel="stylesheet" href="/assets/css/nice-select.css" />
                <link rel="stylesheet" href="/assets/css/jquery-ui.css" />
                <link rel="stylesheet" href="/assets/css/aos.css" />
                <link rel="stylesheet" href="/assets/css/twentytwenty.css" />

                <link rel="stylesheet" href="/assets/css/module-css/banner.css" />
                <link rel="stylesheet" href="/assets/css/module-css/slider.css" />
                <link rel="stylesheet" href="/assets/css/module-css/footer.css" />
                <link rel="stylesheet" href="/assets/css/module-css/services.css" />
                <link rel="stylesheet" href="/assets/css/module-css/sliding-text.css" />
                <link rel="stylesheet" href="/assets/css/module-css/about.css" />
                <link rel="stylesheet" href="/assets/css/module-css/counter.css" />
                <link rel="stylesheet" href="/assets/css/module-css/portfolio.css" />
                <link rel="stylesheet" href="/assets/css/module-css/process.css" />
                <link rel="stylesheet" href="/assets/css/module-css/contact.css" />
                <link rel="stylesheet" href="/assets/css/module-css/testimonial.css" />
                <link rel="stylesheet" href="/assets/css/module-css/brand.css" />
                <link rel="stylesheet" href="/assets/css/module-css/newsletter.css" />
                <link rel="stylesheet" href="/assets/css/module-css/team.css" />
                <link rel="stylesheet" href="/assets/css/module-css/pricing.css" />
                <link rel="stylesheet" href="/assets/css/module-css/event.css" />
                <link rel="stylesheet" href="/assets/css/module-css/blog.css" />
                <link rel="stylesheet" href="/assets/css/module-css/why-choose.css" />
                <link rel="stylesheet" href="/assets/css/module-css/page-header.css" />
                <link rel="stylesheet" href="/assets/css/module-css/error.css" />
                <link rel="stylesheet" href="/assets/css/module-css/shop.css?v=20260209f" />

                <link rel="stylesheet" href="/assets/css/style.css" />
                <link rel="stylesheet" href="/assets/css/responsive.css" />
                {/* Suppress React hydration mismatch errors caused by browser extensions */}
                <script dangerouslySetInnerHTML={{
                    __html: `
                    (function(){
                        var CHUNK_RECOVERY_KEY='__portal_chunk_recovery__';
                        var CHUNK_RECOVERY_TTL=30000;
                        function cleanupChunkRecoveryFlag(){
                            try{
                                var raw=sessionStorage.getItem(CHUNK_RECOVERY_KEY);
                                if(!raw)return;
                                var parsed=JSON.parse(raw);
                                if(!parsed||!parsed.at||(Date.now()-parsed.at)>CHUNK_RECOVERY_TTL){
                                    sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
                                }
                            }catch(_err){
                                sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
                            }
                        }
                        function shouldRecoverChunkError(message, source){
                            var text=(message||'')+' '+(source||'');
                            return (
                                text.indexOf('ChunkLoadError')!==-1||
                                text.indexOf('Loading chunk')!==-1||
                                text.indexOf('Failed to fetch RSC payload')!==-1||
                                text.indexOf('ERR_PROXY_CONNECTION_FAILED')!==-1||
                                text.indexOf('/_next/static/chunks/')!==-1
                            );
                        }
                        function recoverChunkError(message, source){
                            if(!shouldRecoverChunkError(message, source)) return false;
                            try{
                                var raw=sessionStorage.getItem(CHUNK_RECOVERY_KEY);
                                if(raw){
                                    var parsed=JSON.parse(raw);
                                    if(parsed&&parsed.path===location.pathname&&(Date.now()-parsed.at)<CHUNK_RECOVERY_TTL){
                                        return false;
                                    }
                                }
                                sessionStorage.setItem(CHUNK_RECOVERY_KEY, JSON.stringify({ path: location.pathname, at: Date.now() }));
                            }catch(_err){}
                            location.reload();
                            return true;
                        }
                        cleanupChunkRecoveryFlag();
                        window.addEventListener('error',function(e){
                            var source=(e&&((e.filename)||((e.target&&e.target.src)||'')))||'';
                            if(recoverChunkError(e&&e.message, source)){
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                return false;
                            }
                            if(e&&e.message&&(
                                e.message.indexOf('Minified React error #418')!==-1||
                                e.message.indexOf('Minified React error #423')!==-1||
                                e.message.indexOf('Minified React error #425')!==-1||
                                e.message.indexOf('Hydration failed')!==-1||
                                e.message.indexOf('Text content does not match')!==-1||
                                e.message.indexOf('There was an error while hydrating')!==-1
                            )){e.preventDefault();e.stopImmediatePropagation();return false;}
                        },true);
                        window.addEventListener('unhandledrejection',function(e){
                            var reason=e&&e.reason;
                            var message='';
                            if(typeof reason==='string') message=reason;
                            else if(reason&&typeof reason.message==='string') message=reason.message;
                            else if(reason&&typeof reason.toString==='function') message=reason.toString();
                            if(recoverChunkError(message,'')){
                                e.preventDefault();
                                return false;
                            }
                        });
                        var oe=console.error;
                        console.error=function(){
                            var a=arguments[0];
                            var b=arguments[1];
                            if(recoverChunkError(typeof a==='string'?a:'', typeof b==='string'?b:''))return;
                            if(typeof a==='string'&&(
                                a.indexOf('#418')!==-1||
                                a.indexOf('#423')!==-1||
                                a.indexOf('#425')!==-1||
                                a.indexOf('Hydration')!==-1
                            ))return;
                            return oe.apply(console,arguments);
                        };
                    })();
                `}} />
            </head>
            <body className={`${montserrat.variable} font-sans bg-black text-white`} suppressHydrationWarning>
                <VisitorTracker />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
