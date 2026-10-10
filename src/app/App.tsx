import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "@/app/components/ScrollToTop";
import { AboutPage } from "@/app/pages/AboutPage";
import { ContactPage } from "@/app/pages/ContactPage";
import { HomePage } from "@/app/pages/HomePage";
import { PostPage } from "@/app/pages/PostPage";
import { PostsPage } from "@/app/pages/PostsPage";
import { ServicesPage } from "@/app/pages/ServicesPage";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/:id" element={<PostPage />} />
      </Routes>
    </BrowserRouter>
  );
}
