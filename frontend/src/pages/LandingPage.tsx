import AboutSection from "../components/AboutSection"
import ContactSection from "../components/ContactSection"
import Hero from "../components/Hero"
import Journey from "../components/Journey"
import Navbar from "../components/Navbar"
import ResearchInterests from "../components/ResearchInterests"
import SelectedPatents from "../components/SelectedPatents"
import SelectedResearch from "../components/SelectedResearch"

const LandingPage = () => {
    return (
        <div>
            <Navbar />
            <Hero />
            <AboutSection />
            <ResearchInterests />
            <SelectedResearch />
            <SelectedPatents />
            <Journey />
            <ContactSection />
        </div>
    )
}

export default LandingPage
