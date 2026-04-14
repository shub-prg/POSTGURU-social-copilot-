import { Russo_One } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-russo-one",
});

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${russoOne.variable} font-sans min-h-full flex flex-col antialiased bg-background text-foreground transition-colors duration-300 text-base`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
