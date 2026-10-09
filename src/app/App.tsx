import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "@/app/components/ScrollToTop";
import { AboutPage } from "@/app/pages/AboutPage";
import { HomePage } from "@/app/pages/HomePage";
import { ServicesPage } from "@/app/pages/ServicesPage";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
