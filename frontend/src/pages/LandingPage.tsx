import AboutSection from "../components/AboutSection"
import ContactSection from "../components/ContactSection"
import Hero from "../components/Hero"
import Journey from "../components/Journey"
import Navbar from "../components/Navbar"
import ResearchInterests from "../components/ResearchInterests"
import SelectedPatents from "../components/SelectedPatents"
import SelectedResearch from "../components/SelectedResearch"
import { usePageSeo } from "../hooks/usePageContent"

/**
 * Home page.
 *
 * Every section reads the `home` page document; while the API is pending or
 * unreachable each component keeps its static markup, so the page renders
 * instantly and only swaps in edited content once a valid response arrives.
 */
const PAGE_SLUG = "home"

const LandingPage = () => {
    usePageSeo(PAGE_SLUG)

    return (
        <div>
            <Navbar />
            <Hero pageSlug={PAGE_SLUG} />
            <AboutSection pageSlug={PAGE_SLUG} />
            <ResearchInterests pageSlug={PAGE_SLUG} />
            <SelectedResearch pageSlug={PAGE_SLUG} />
            <SelectedPatents pageSlug={PAGE_SLUG} />
            <Journey pageSlug={PAGE_SLUG} />
            <ContactSection pageSlug={PAGE_SLUG} />
        </div>
    )
}

export default LandingPage
