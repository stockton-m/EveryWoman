import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { NotFoundGuideLine } from "@/app/components/notFound/NotFoundGuideLine";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import { BROWN, CREAM, EMBER, SANS, SERIF } from "@/app/constants";

export function NotFoundPage() {
  return (
    <div
      className="not-found-page"
      style={{ fontFamily: SANS, minHeight: "100vh", background: CREAM }}
    >
      <NotFoundGuideLine />

      <header
        className="not-found-page__header border-b"
        style={{ borderColor: "rgba(42,31,26,0.06)" }}
      >
        <SiteNav variant="light" />
      </header>

      <main className="not-found-page__main">
        <section className="not-found-hero">
          <h1
            className="not-found-hero__title"
            style={{ color: EMBER, fontFamily: SERIF }}
          >
            Page not found
          </h1>

          <p className="not-found-hero__intro" style={{ color: BROWN }}>
            The link may be out of date, or the page may have moved.
          </p>

          <div className="not-found-hero__actions">
            <Link
              to="/"
              className="pill-btn pill-btn--ember inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold"
              style={{ fontFamily: SANS, textDecoration: "none" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
          </div>
        </section>
      </main>

      <div className="not-found-page__footer">
        <SiteFooter />
      </div>
    </div>
  );
}
