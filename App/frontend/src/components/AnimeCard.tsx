// this component will used to display cards for the different categories of anime cards
// TODO: add in sync loader to show as the images load
// TODO: add hover effect to display the show information (add later on maybe)

import { AniListMedia } from "../schemas/animeSchemas";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

// showcases anime images and the title
export const AnimeCard = ({
  anime,
  // might make a function to move the user to the top of the anime info page when loaded
  // TODO: add "id" to help link the anime name in the param to get the data for the anime page
}: {
  anime: AniListMedia;
}) => {
  return (
    // NOTE:  Changed the route an absolute route so it always takes to the anime info page through the whole application
    <Link to={`/anime/${anime.id}`}>
      {/* NOTE: This changes the width of the cards */}
      <div className="group w-60 flex-col cursor-pointer relative rounded-2xl">
        <img
          alt={anime.title.english ? anime.title.english : ""}
          src={anime.coverImage.large}
          // NOTE: this changes the height of the cards
          className="w-full h-105 object-cover border-2 border-black rounded-2xl"
        />
        <div className="font-[Inter] mt-2 font-semibold text-[13px] h-12 text-center overflow-hidden cursor-pointer transition-opacity duration-200 group-hover:opacity-0">
          {/* make sure that the titles are only showed up to a certain amount */}
          {anime.title.english
            ? anime.title.english.split(" ").slice(0, 6).join(" ")
            : ""}
        </div>
        {/*NOTE: HOVER STATE FOR THE ANIME CARDS */}
        <div className="absolute opacity-0 bg-black/70 inset-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
          <div className="absolute opacity-0 group-hover:opacity-100 transition-all  flex flex-col gap-y-1 inset-x-0 p-4 ">
            <div className="">
              <p className="text-lg font-bold">{anime.title.english}</p>
              <p>{`Episodes: ${anime.episodes}`}</p>
              <p>{anime.status}</p>

              {anime.studios?.nodes.map((studio) => (
                <div key={studio.id}>{studio.name}</div>
              ))}
            </div>
          </div>
          {/* TODO: WORK ON GETTING THE DESCRIPTION TO SHOW UP ON THE CARD  */}
          <p className="text-sm">{anime.description}</p>
          <div className="absolute bottom-17 left-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-4xl border-[6px] border-[#3CB4FF] text-2xl font-bold mr-2">
              {anime.averageScore}
            </div>
          </div>
          {/* TODO: ADD MORE ICONS FOR HOVER STATE */}
          <div className="absolute bottom-2 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex h-10 w-10 items-center justify-center bg-black/50 text-white">
              <Plus size={25} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
