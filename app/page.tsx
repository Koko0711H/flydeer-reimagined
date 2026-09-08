import {
  Hero,
  WhySection,
  ProductTheater,
  IndustrySection,
  CompanyTeaser,
} from '@/components/site/sections';
import { CaseGallery } from '@/components/site/case-gallery';
import { ContactBand } from '@/components/site/chrome';
export default function Home() {
  return (
    <main id="main">
      <Hero />
      <WhySection />
      <ProductTheater />
      <IndustrySection />
      <CompanyTeaser />
      <CaseGallery />
      <ContactBand />
    </main>
  );
}
