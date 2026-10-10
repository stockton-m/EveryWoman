import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteNav } from "@/app/components/SiteNav";
import {
  findSubstackPost,
  formatPostDate,
  getPlatformLabel,
} from "@/app/content/posts";
import { BROWN, CREAM, EMBER, SANS, SERIF, STONE } from "@/app/constants";

export function PostPage() {
  const { id } = useParams();
  const post = id ? findSubstackPost(id) : undefined;

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
        <Link
          to="/posts"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: BROWN, fontFamily: SANS, textDecoration: "none" }}
        >
          <ArrowLeft className="h-4 w-4" />
          All posts
        </Link>

        {post ? (
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
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: EMBER, fontFamily: SANS, textDecoration: "none" }}
            >
              Read on Substack
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </article>
        ) : (
          <div>
            <h1
              className="font-bold"
              style={{
                color: BROWN,
                fontFamily: SERIF,
                fontSize: "clamp(2rem, 4vw, 3rem)",
              }}
            >
              Post not found
            </h1>
            <p className="mt-4 text-base leading-relaxed" style={{ color: BROWN }}>
              This post isn&apos;t in the archive.
            </p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
