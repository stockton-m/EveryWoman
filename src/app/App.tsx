import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "@/app/components/ScrollToTop";
import { HomePage } from "@/app/pages/HomePage";
import { ServicesPage } from "@/app/pages/ServicesPage";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
