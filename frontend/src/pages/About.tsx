import Navbar from "../components/Navbar";
import AboutHeader from "../components/about/AboutHeader";
import AboutProfile from "../components/about/AboutProfile";
import FocusAreas from "../components/about/FocusAreas";
import Honors from "../components/Honors";
import Journey from "../components/Journey";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import { usePageSeo } from "../hooks/usePageContent";

/**
 * About page.
 *
 * A different composition from the home page on purpose: an editorial masthead
 * and a sticky-portrait biography replace the two-column hero and the glass
 * about card, so `/` and `/about` never read as the same screen.
 *
 * Content sources (all API-driven, static fallbacks where the block supports
 * them): the `about` document (masthead, biography, figures, timeline), the
 * home document's interests (presented here as a numbered list), the `contact`
 * document's call to action, and the `footer` document.
 */
const PAGE_SLUG = "about";

function About() {
    usePageSeo(PAGE_SLUG);

    return (
        <>
            <Navbar />
            <main className="w-full flex-1">
                <AboutHeader pageSlug={PAGE_SLUG} />
                <AboutProfile pageSlug={PAGE_SLUG} />
                <FocusAreas />
                <Honors />
                <Journey pageSlug={PAGE_SLUG} />
                {/* The `about` document carries no `cta` section (which would
                    hide the block), so the site-wide call to action comes from
                    the `contact` document — the same copy `/contact` shows. */}
                <ContactSection pageSlug="contact" />
            </main>
            <Footer pageSlug="footer" />
        </>
    );
}

export default About;
