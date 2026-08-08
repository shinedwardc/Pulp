import type { Metadata } from "next";
import { JetBrains_Mono, Lora } from "next/font/google";
import "./globals.css";

// Display + body voice (the human's words). Variable weight 400–700.
const lora = Lora({
	variable: "--font-lora",
	subsets: ["latin"],
});

// System voice (everything the machine says: paths, labels, status, stamps).
const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Pulp — Your Digest",
	description:
		"Tell your feed what today should be about. No ranking, no algorithm — you asked, we fetched.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${lora.variable} ${jetbrainsMono.variable} h-full antialiased`}
		>
			<body className="pulp min-h-full flex flex-col">{children}</body>
		</html>
	);
}
