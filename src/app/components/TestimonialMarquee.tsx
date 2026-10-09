import { TESTIMONIALS } from "@/app/content/testimonials";
import { BLUSH, BROWN, CREAM, EMBER, SANS, SAGE, SERIF } from "@/app/constants";

const CARD_TONES = [
  { background: EMBER, color: CREAM },
  { background: BLUSH, color: BROWN },
  { background: SAGE, color: CREAM },
] as const;

function TestimonialCards({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="testimonial-set" aria-hidden={hidden || undefined}>
      {TESTIMONIALS.map((testimonial, index) => {
        const tone = CARD_TONES[index % CARD_TONES.length];
        return (
          <li
            key={`${testimonial.name}-${index}`}
            className="testimonial-card flex flex-col justify-between rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10"
            style={{
              background: tone.background,
              color: tone.color,
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)",
            }}
          >
            <p
              className="text-left leading-snug font-medium"
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(1.55rem, 2.4vw, 1.9rem)",
              }}
            >
              {testimonial.text}
            </p>
            <p
              className="text-right text-sm md:text-base mt-8"
              style={{ fontFamily: SANS }}
            >
              — {testimonial.name}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function TestimonialMarquee() {
  return (
    <section className="mb-16" aria-labelledby="client-testimonials-heading">
      <div className="testimonial-band">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <h2
            id="client-testimonials-heading"
            className="font-bold text-left mb-8"
            style={{
              fontFamily: SERIF,
              color: CREAM,
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            }}
          >
            From my clients...
          </h2>
        </div>
        <div className="testimonial-track">
          <TestimonialCards />
          <TestimonialCards hidden />
        </div>
      </div>
    </section>
  );
}
