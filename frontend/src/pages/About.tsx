import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import AboutSection from '../components/AboutSection'
import Journey from '../components/Journey'
import ContactSection from '../components/ContactSection'
import Footer from '../components/Footer'
import { usePageSeo } from '../hooks/usePageContent'

/** About page — content comes from the `about` page document (static fallback). */
const PAGE_SLUG = "about"

function About() {
    usePageSeo(PAGE_SLUG)

    return (
        <>
            <Navbar />
            <Hero pageSlug={PAGE_SLUG} />
            <AboutSection pageSlug={PAGE_SLUG} />
            <Journey pageSlug={PAGE_SLUG} />
            <ContactSection pageSlug={PAGE_SLUG} />
            <Footer pageSlug="footer" />
            </>
    )
}

export default About
