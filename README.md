# Key Stage Learning website

The website for the [Key Stage Learning](https://www.youtube.com/@KeyStageLearning) YouTube channel: free video lessons for KS2, KS3 and GCSE.

Built with [Astro](https://astro.build) as a plain static site, with [Pagefind](https://pagefind.app) for search. Hosted on Hostinger.

## Adding a new video

1. Open `src/data/catalogue.ts`.
2. Copy one line in the `videos` list and change the YouTube id (the part after `watch?v=`), the page name (`slug`), the titles, the topic and the key stages.
3. If it's one of the newest videos, add its slug to the top of `newestFirst`.
4. Save the change to the `main` branch. The site rebuilds and uploads itself in about two minutes.

A topic that is coming soon moves from `comingSoon` into `topics` once its first video is out.

## Working on it locally

```
npm install
npm run dev      # preview at http://localhost:4321
npm run build    # builds the finished site into dist/
```

## Going live

`.github/workflows/deploy.yml` builds the site and uploads `dist/` to Hostinger's `public_html` over FTPS.
It needs the secrets `FTP_SERVER`, `FTP_USERNAME` and `FTP_PASSWORD` in the repository settings.
`public/.htaccess` sends keystagelearning.net and the bare .org address to https://www.keystagelearning.org.
