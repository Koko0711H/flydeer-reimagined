import { CaseGallery } from '@/components/site/case-gallery';
import { ContactBand } from '@/components/site/chrome';
export const metadata = { title: '项目应用场景 | FRS POWER 福瑞斯' };
export default function CasesPage() {
  return (
    <main id="main">
      <h1 className="sr-only">项目应用场景 / Project applications</h1>
      <CaseGallery grid />
      <ContactBand />
    </main>
  );
}
