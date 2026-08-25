import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "AdLoca Local Marketplace", description: "Buy and sell popular items near you with safer token transactions." };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
