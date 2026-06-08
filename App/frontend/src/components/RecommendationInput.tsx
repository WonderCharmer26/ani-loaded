import { Search, Sparkles } from "lucide-react";

type RecommendationInputProps = {
  placeholder?: string;
  onButtonClick?: () => void;
};

export default function RecommendationInput({
  placeholder = "What are you in the mood for?",
  onButtonClick,
}: RecommendationInputProps) {
  return (
    <div className="group relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1117] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition-all duration-300 focus-within:border-[#3CB4FF]/55 focus-within:shadow-[0_0_0_1px_rgba(60,180,255,0.22),0_18px_60px_rgba(7,18,32,0.7)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(60,180,255,0.18),_transparent_32%),radial-gradient(circle_at_85%_50%,_rgba(81,170,255,0.16),_transparent_24%)]" />

      <div className="relative flex items-center gap-3 rounded-[1.6rem] border border-white/6 bg-[linear-gradient(135deg,rgba(7,12,20,0.96),rgba(18,25,35,0.92))] px-4 py-3">
        <div className="hidden h-11 items-center gap-2 rounded-full border border-[#3CB4FF]/20 bg-[#3CB4FF]/8 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#8dd6ff] sm:flex">
          <Sparkles className="h-3.5 w-3.5" />
          Find your next watch
        </div>

        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-transparent bg-white/4 px-4 py-2.5 transition-colors duration-300 group-focus-within:border-[#3CB4FF]/20 group-focus-within:bg-white/6">
          <Search className="h-4.5 w-4.5 shrink-0 text-[#66c9ff]" />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full bg-transparent text-[0.98rem] text-slate-100 placeholder:text-slate-500 outline-none"
          />
        </label>

        <button
          type="button"
          onClick={onButtonClick}
          className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#8edcff]/25 bg-[linear-gradient(135deg,#1b6fa6,#3CB4FF)] text-white shadow-[0_10px_24px_rgba(60,180,255,0.28)] transition duration-300 before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.36),transparent_45%)] before:opacity-70 hover:scale-[1.03] hover:shadow-[0_12px_28px_rgba(60,180,255,0.38)] focus:outline-none focus:ring-2 focus:ring-[#3CB4FF]/50"
          aria-label="Search"
        >
          <Search className="relative z-10 h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
