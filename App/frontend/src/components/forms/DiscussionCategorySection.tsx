import { DiscussionFormApi } from "@/types/discussionForm";
import { useLayoutEffect, useRef, useState } from "react";

type DiscussionCategorySectionProps = {
  form: DiscussionFormApi;
};

const categoryOptions = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    label: "Episode",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    label: "Fan theories",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    label: "Spoilers",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    label: "Questions",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    label: "General",
  },
];

// edges of the pill, measured in from the left/right sides of the track
type PillRect = { left: number; right: number };

// leading edge moves first, trailing edge lags and springs in so the pill stretches then settles
const LEADING_EDGE = "180ms cubic-bezier(0.3, 0, 0.2, 1)";
const TRAILING_EDGE = "320ms cubic-bezier(0.34, 1.4, 0.64, 1) 40ms";

function CategoryTrack({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<PillRect | null>(null);
  const [direction, setDirection] = useState<"left" | "right">("right");

  // measure the active option so the pill can morph over to it
  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const option = optionRefs.current[value];
      if (!track || !option) return;

      const left = option.offsetLeft;
      // right is measured from the track's visible box, even when it scrolls
      const right = track.clientWidth - (option.offsetLeft + option.offsetWidth);

      setPill((previous) => {
        if (previous && left !== previous.left) {
          setDirection(left > previous.left ? "right" : "left");
        }
        return { left, right };
      });
    };

    measure();

    // on narrow screens the track scrolls, keep the active option in view
    const track = trackRef.current;
    const option = optionRefs.current[value];
    if (track && option && track.scrollWidth > track.clientWidth) {
      track.scrollTo({
        left: option.offsetLeft - (track.clientWidth - option.offsetWidth) / 2,
        behavior: "smooth",
      });
    }

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value]);

  const transition =
    direction === "right"
      ? `right ${LEADING_EDGE}, left ${TRAILING_EDGE}`
      : `left ${LEADING_EDGE}, right ${TRAILING_EDGE}`;

  return (
    <div
      ref={trackRef}
      role="radiogroup"
      aria-label="Category"
      className="no-scrollbar relative flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-[#0C0E12] p-0.75"
    >
      {/* the pill sits behind the labels and morphs between them */}
      {pill ? (
        <span
          aria-hidden
          className="absolute top-0.75 bottom-0.75 rounded-full bg-[#1D3550] shadow-[0_1px_2px_#00000066] motion-reduce:transition-none!"
          style={{ left: pill.left, right: pill.right, transition }}
        />
      ) : null}

      {categoryOptions.map((category) => {
        const isActive = category.id === value;

        return (
          <button
            key={category.id}
            ref={(node) => {
              optionRefs.current[category.id] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(category.id)}
            className={`relative shrink-0 rounded-full px-3 py-1.25 font-geist text-[13px]/4.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[#4DA3F0] ${
              isActive
                ? "font-semibold text-[#CFE6FB]"
                : "font-medium text-[#7E8899] hover:text-[#C3CBD8]"
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

export default function DiscussionCategorySection({
  form,
}: DiscussionCategorySectionProps) {
  return (
    <form.Field
      name="category_id"
      children={(field) => (
        <CategoryTrack
          value={field.state.value}
          onChange={(nextValue) => field.handleChange(nextValue)}
        />
      )}
    />
  );
}
