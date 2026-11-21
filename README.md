# Key Stage Learning website

The website for the [Key Stage Learning](https://www.youtube.com/@KeyStageLearning) YouTube channel: free video lessons for KS2, KS3 and GCSE.

Built with [Astro](https://astro.build) as a plain static site, with [Pagefind](https://pagefind.app) for search. Hosted on Cloudflare.

## Adding a new video

1. Open `src/data/catalogue.ts`.
2. Copy one line in the `videos` list and change the YouTube id (the part after `watch?v=`), the page name (`slug`), the titles, the topic and the key stages.
3. If it's one of the newest videos, add its slug to the top of `newestFirst`.
4. Save the change to the `main` branch. Cloudflare rebuilds and publishes the site in a couple of minutes.

A topic that is coming soon moves from `comingSoon` into `topics` once its first video is out.

## Working on it locally

```
npm install
npm run dev      # preview at http://localhost:4321
npm run build    # builds the finished site into dist/
```

## Going live

The site is hosted on Cloudflare Workers (static pages for now; account and paid-video pages will run as code later).

- Cloudflare's GitHub connection (Workers Builds) builds and deploys every push to `main`: build command `npm run build`, deploy command `npx wrangler deploy`.
- `wrangler.jsonc` holds the Cloudflare settings. The site answers on www.keystagelearning.org.
- Cloudflare redirect rules send keystagelearning.org and keystagelearning.net (with or without www) to https://www.keystagelearning.org.
- `public/_headers` sets the security headers.

To try the Cloudflare version locally: `npm run build && npx wrangler dev`.
