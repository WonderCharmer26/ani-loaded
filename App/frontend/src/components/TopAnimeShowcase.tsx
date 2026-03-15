const DUMMY_ENTRIES = [
  {
    rank: 1,
    title: "One Piece",
    coverImage:
      "https://www.figma.com/api/mcp/asset/955c7db6-ce78-46cb-84c7-00c07281f55f",
  },
  {
    rank: 2,
    title: "Hunter x Hunter",
    coverImage:
      "https://www.figma.com/api/mcp/asset/e6139a68-132c-4bb0-aed1-1163d8e7916a",
  },
  {
    rank: 3,
    title: "Bleach",
    coverImage:
      "https://www.figma.com/api/mcp/asset/b99f3194-0f95-48aa-96e4-6c409db8048c",
  },
  {
    rank: 4,
    title: "Katekyo Hitman Reborn",
    coverImage:
      "https://www.figma.com/api/mcp/asset/74a62317-5a17-448b-9611-a2765d478d66",
  },
  {
    rank: 5,
    title: "Unknown Anime",
    coverImage:
      "https://www.figma.com/api/mcp/asset/fcf80b2f-94aa-40bd-b98d-c99f9408c6d2",
  },
];

interface TopAnimeListShowcaseProps {
  username?: string;
}

export default function TopAnimeListShowcase({
  username = "AnimeWatcher63",
}: TopAnimeListShowcaseProps) {
  return (
    <div className="w-full flex-col">
      {/* List header */}
      <div className="flex items-start ">
        {" "}
        <div className="mb-1">
          <p className="font-bold text-[32px] text-white leading-tight">
            {username}'s
          </p>
          <p className="font-medium text-[20px] flex items-start text-[#9a9a9a] tracking-wide mt-0.5">
            TOP 5 ANIME
          </p>
        </div>
      </div>

      {/* Anime cards row */}
      <div className="flex gap-[13px]">
        {DUMMY_ENTRIES.map((entry) => (
          <div key={entry.rank} className="relative flex-1 pt-[25px]">
            {/* Rank badge */}
            <div className="absolute top-0 -right-5 -translate-x-1/12 w-[70px] h-[70px] rounded-full bg-[#101114] border-2 border-slate-700 flex items-center justify-center z-10">
              <span className="font-bold text-[36px] text-white leading-none">
                {entry.rank}
              </span>
            </div>

            {/* Cover image */}
            <img
              src={entry.coverImage}
              alt={entry.title}
              className="w-full h-[384px] object-cover rounded-[38px]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
