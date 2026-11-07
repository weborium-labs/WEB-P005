import Navbar from "../components/Navbar";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import { usePageSeo } from "../hooks/usePageContent";

/**
 * Contact page.
 *
 * The copy and call-to-action come from the `contact` page document's `cta`
 * section; the static defaults inside `ContactSection` render immediately and
 * are replaced silently once the API responds.
 */
const PAGE_SLUG = "contact";

const ContactPage = () => {
  usePageSeo(PAGE_SLUG);

  return (
    <>
      <Navbar />
      <main className="w-full flex-1">
        <ContactSection pageSlug={PAGE_SLUG} />
      </main>
      <Footer pageSlug="footer" />
    </>
  );
};

export default ContactPage;
