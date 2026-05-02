/** @type {import("pliny/config").PlinyConfig } */
const siteMetadata = {
  title: "Bukhari's Archive",
  author: 'Hassaan Ali Bukhari',
  headerTitle: "Bukhari's Archive",
  description: 'My corner of the internet.',
  language: 'en-us',
  theme: 'dark',
  siteUrl: 'https://b3ta-blocker.github.io',
  siteRepo: 'https://github.com/B3TA-BLOCKER/b3ta-blocker.github.io',
  siteLogo: `${process.env.BASE_PATH || ''}/static/images/logo.png`,
  socialBanner: `${process.env.BASE_PATH || ''}/static/images/twitter-card.png`,
  email: 'root.b3ta.blocker@gmail.com',
  github: 'https://github.com/B3TA-BLOCKER',
  x: 'https://twitter.com/B3TA_BLOCKER',
  linkedin: 'https://www.linkedin.com/in/hassaan-ali-bukhari/',
  locale: 'en-US',
  stickyNav: true,
  analytics: {},
  newsletter: {
    provider: 'buttondown',
  },
  comments: {
    provider: 'giscus',
    giscusConfig: {
      repo: process.env.NEXT_PUBLIC_GISCUS_REPO,
      repositoryId: process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID,
      category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY,
      categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
      mapping: 'pathname',
      reactions: '1',
      metadata: '0',
      theme: 'dark',
      darkTheme: 'transparent_dark',
      themeURL: '',
      lang: 'en',
    },
  },
  search: {
    provider: 'kbar',
    kbarConfig: {
      searchDocumentsPath: `${process.env.BASE_PATH || ''}/search.json`,
    },
  },
}

module.exports = siteMetadata
