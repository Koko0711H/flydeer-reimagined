import type { Metadata } from 'next';
import './globals.css';
import './motion.css';
import './frs.css';
import './power-story.css';
import { SiteProvider } from '@/components/site/provider';
import { Header, Footer } from '@/components/site/chrome';
import { MotionSystem } from '@/components/site/motion';

export const metadata: Metadata = {
  title: 'FRS POWER 福瑞斯 | 让动力，走得更远',
  icons: { icon: '/media/frs-logo.png' },
  description:
    '探索福瑞斯的开架、静音箱与集装箱发电机组。从产品选型、制造吊装到装车交付的动力解决方案。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteProvider>
          <Header />
          {children}
          <Footer />
          <MotionSystem />
        </SiteProvider>
      </body>
    </html>
  );
}
