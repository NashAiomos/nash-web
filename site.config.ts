export const siteConfig = {
  author: 'Nash Aiomos',
  title: 'Nash Aiomos',
  url: 'https://nashaiomos.github.io/nash-web/',
  description: 'Nash Aiomos — software engineer and writer exploring Web3, blockchain, the metaverse, and AI. Projects, ideas, and stories about technology and life.',
  lang: 'en',
  alternateNames: ['Nash', '中子星', 'NeutronStar'],
  socialImage: 'images/social-card-web3-ai.png',
  socialImageAlt: 'Nash Aiomos — Software engineer & writer. Web3 · Blockchain · Metaverse · AI.',
}

export const navLinks = [
  {
    title: 'Blog',
    path: '/blog/',
    icon: 'i-icon-park-outline-align-text-right-one',
  },
  {
    title: 'Projects',
    path: '/projects/',
    icon: 'i-icon-park-outline-blocks-and-arrows',
  },
  {
    title: 'Tags',
    path: '/tags/',
    icon: 'i-icon-park-outline-tag-one',
  },
  {
    title: 'Search',
    path: '/search/',
    icon: 'i-icon-park-outline-search',
  },
  {
    title: 'About',
    path: '/',
    icon: 'i-icon-park-outline-grinning-face-with-open-mouth',
  },

]

export const socialLinks = [
  {
    title: 'X',
    path: 'https://x.com/nashaiomos',
    icon: 'i-simple-icons-x',
  },
  {
    title: 'Github',
    path: 'https://github.com/NashAiomos',
    icon: 'i-icon-park-outline-github',
  },
]

export const projectList = [
  {
    name: 'IceCube',
    desc: 'A decentralized social app where users can trade shares tied to individual posts. I designed the app’s architecture, features, and interface.',
    links: [
      { label: 'View demo', href: 'https://mjlwf-iqaaa-aaaan-qmtna-cai.icp0.io/' },
      { label: 'Source code', href: 'https://github.com/NeutronStarDAO/icecube' },
    ],
  },
  {
    name: 'Constellation Book',
    desc: 'An illustrated technical guide I wrote about blockchain architecture and decentralized application development. Available in English and Chinese.',
    links: [
      { label: 'Read in English', href: 'https://neutronstardao.github.io/constellation.github.io/' },
      { label: '阅读中文版', href: 'https://neutronstardao.github.io/constellationzh.github.io/', lang: 'zh-Hans' },
    ],
  },
]
