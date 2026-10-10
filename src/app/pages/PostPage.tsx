import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import { NotFoundPage } from "@/app/pages/NotFoundPage";
import {
  findSubstackPost,
  formatPostDate,
  getPlatformLabel,
} from "@/app/content/posts";
import { BROWN, CREAM, EMBER, SANS, SERIF, STONE } from "@/app/constants";

const substackLinkClass =
  "pill-btn pill-btn--ember inline-flex items-center gap-1.5 rounded-full border border-transparent px-5 py-2 text-sm font-semibold";

const pillLinkStyle = { fontFamily: SANS, textDecoration: "none" };

export function PostPage() {
  const { id } = useParams();
  const post = id ? findSubstackPost(id) : undefined;

  if (!post) {
    return <NotFoundPage />;
  }

  return (
    <div
      style={{
        background: CREAM,
        fontFamily: SANS,
        minHeight: "100vh",
      }}
    >
      <header
        className="border-b"
        style={{
          background: CREAM,
          borderColor: "rgba(42,31,26,0.06)",
        }}
      >
        <SiteNav variant="light" />
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 md:px-10 md:pt-14">
        <div className="mb-14 flex items-center justify-between gap-4">
          <Link
            to="/posts"
            className="pill-btn pill-btn--subscribe-light inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
            style={pillLinkStyle}
          >
            <ArrowLeft className="h-4 w-4" />
            All posts
          </Link>
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${substackLinkClass} shrink-0`}
            style={pillLinkStyle}
          >
            Read on Substack
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <article>
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: EMBER }}
          >
            {getPlatformLabel(post.source)}
          </p>
          <h1
            className="font-bold leading-tight"
            style={{
              color: BROWN,
              fontFamily: SERIF,
              fontSize: "clamp(2rem, 4vw, 3.25rem)",
            }}
          >
            {post.title}
          </h1>
          {post.description ? (
            <p
              className="mt-4 text-xl leading-relaxed md:text-2xl"
              style={{ color: BROWN, fontFamily: SERIF }}
            >
              {post.description}
            </p>
          ) : null}
          <p className="mt-5 text-sm" style={{ color: STONE }}>
            <time dateTime={post.publishedAt}>
              {formatPostDate(post.publishedAt)}
            </time>
            {post.metadata?.author ? ` · ${post.metadata.author}` : null}
          </p>
          <div
            className="post-body mt-10"
            dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
          />
          <div className="mt-12 flex justify-center">
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={substackLinkClass}
              style={pillLinkStyle}
            >
              Read on Substack
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
