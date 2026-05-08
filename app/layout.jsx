import GlobalProvider from "@/components/Application/GlobalProvider";
import "./globals.css";
import { Assistant } from 'next/font/google'
import { ToastContainer } from 'react-toastify';
import { Analytics } from '@vercel/analytics/next';

const assistantFont = Assistant({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap'
})

export const metadata = {
  title: "ThriftYatra - Thrifted Treasures & Indie Brands",
  description: "India's circular fashion marketplace. Buy & sell pre-loved thrift finds and discover unique indie clothing brands. Sustainable fashion made affordable.",
  keywords: "thrift, thrift store india, second hand clothes, pre-owned fashion, sustainable fashion, indie brands, thrift shopping, buy sell clothes",
  openGraph: {
    title: "ThriftYatra - Thrifted Treasures & Indie Brands",
    description: "India's circular fashion marketplace. Buy & sell pre-loved thrift finds.",
    url: "https://thriftyatra.com",
    siteName: "ThriftYatra",
    type: "website",
  },
  viewport: "width=device-width, initial-scale=1.0",
};

// ✅ Production: Disable console.log
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${assistantFont.className} antialiased`}>
        <GlobalProvider>
          <ToastContainer />
          {children}
        </GlobalProvider>
        <Analytics />
      </body>
    </html>
  );
}