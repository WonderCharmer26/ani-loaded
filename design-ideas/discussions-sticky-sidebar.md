# Discussions page: sticky sidebar idea

Status: idea, not built. Saved so it can be picked up later.

## Where the designs live

The mockups are in the Paper file "Aniloaded". Three artboards on Page 1 matter for this idea:

- **Discussions - Reddit style**: the original design.
- **Discussions - Reddit style v2**: the polished rendition. This is the version to build from.
- **Discussions - v2 scrolled (sticky sidebar)**: a static mock of v2 after the user has scrolled down.

## The idea

On the v2 page the "Create post" button sits in the About panel in the sidebar, and a "Start a discussion" composer sits above the feed. Both start a new post, so on a static page one of them is redundant.

Rather than drop the sidebar button, keep it and make the sidebar sticky. Once the composer scrolls out of view, the button is still on screen, so the user can start a post from anywhere in a long feed.

The scrolled artboard shows this. The composer, sort row and the top of the first post are gone, the feed has moved up, and the sidebar is still in the same place under the nav.

## Build notes

- Use `position: sticky` on the sidebar with a top offset of about 100px, which clears the nav.
- The full sidebar (About, Categories, Rules) is taller than a short viewport. If it doesn't fit, pin only the About panel and let Categories and Rules scroll normally.
- Paper can't show sticky behavior, which is why the scrolled artboard is a static mock.
- Open question: whether the composer's "New post" pill should stay once the sidebar button is always visible. The composer bar is still the more natural place to start typing, so I'd keep it.

## Other v2 decisions worth remembering

- The nav matches the original design: all-caps bold links, the rounded navy search pill, and the deeper-blue Sign In pill.
- Buttons follow the original too. Create post and New post are deeper-blue pills (`#0066A5`). The sort tabs are pills, with the active one filled navy. The comment, share and save buttons are transparent with muted text.
- The page body still uses the lighter blue (`#4DA3F0`) for the active category and the upvote state, so there are two blues on the page. Decide whether to unify them.
- The About panel heading currently reads "Discussions" instead of "About Discussions".
