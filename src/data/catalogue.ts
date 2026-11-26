// The whole video catalogue lives in this file.
// To add a new video: copy one line in `videos`, change the YouTube id, title, topic and key stages.

export type KeyStage = 'ks2' | 'ks3' | 'gcse';
export type Kind = 'lesson' | 'quiz' | 'short';

export interface KeyStageInfo {
  id: KeyStage;
  name: string;
  ages: string;
  years: string;
  blurb: string;
  live: boolean;
}

export const keyStages: KeyStageInfo[] = [
  { id: 'ks2', name: 'KS2', ages: 'Ages 7 to 11', years: 'Years 3 to 6', live: true,
    blurb: 'Short, colourful stories with Selma and Pengbot. Big ideas made simple.' },
  { id: 'ks3', name: 'KS3', ages: 'Ages 11 to 14', years: 'Years 7 to 9', live: true,
    blurb: 'Aaliyah and Pengbot go deeper: processors, Python, databases and logic.' },
  { id: 'gcse', name: 'GCSE', ages: 'Ages 14 to 16', years: 'Years 10 and 11', live: false,
    blurb: 'Exam-focused lessons that build on everything from KS3. Coming soon.' },
];

export interface Subject {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  live: boolean;
}

export const subjects: Subject[] = [
  { id: 'computing', name: 'Computing and IT', icon: '💻', live: true,
    blurb: 'Matched to the England National Curriculum for Computing at KS2 and KS3.' },
  { id: 'maths', name: 'Maths', icon: '➗', live: false, blurb: 'Coming soon' },
  { id: 'science', name: 'Science', icon: '🧪', live: false, blurb: 'Coming soon' },
];

export interface Topic {
  id: string;
  subject: string;
  title: string;
  blurb: string;
  /** true when the topic is a Part 1 (KS2) and Part 2 (KS3) pair */
  twoPart?: boolean;
}

export const topics: Topic[] = [
  { id: 'hardware-and-software', subject: 'computing', twoPart: true, title: 'Hardware and Software',
    blurb: "What's inside a computer and the programs that make it work, from Pengbot's Gadget Lab to Processor Power." },
  { id: 'data-and-spreadsheets', subject: 'computing', twoPart: true, title: 'Data and Spreadsheets',
    blurb: "Collect data, put it in a table and let a spreadsheet do the sums, with Pengbot's Penguin Survey and Fish Fest." },
  { id: 'making-web-pages', subject: 'computing', twoPart: true, title: 'Making Web Pages',
    blurb: "Build Pengbot's Penguin Website, then write real HTML and CSS as Aaliyah codes the Penguin Times." },
  { id: 'programming', subject: 'computing', twoPart: true, title: 'Programming',
    blurb: "From block code in Pengbot's Maze Game, to typing real Python in the Python Quest, to planning, building and testing a whole program in Aaliyah's Quiz Machine." },
  { id: 'searching-and-sorting', subject: 'computing', twoPart: true, title: 'Searching and Sorting',
    blurb: 'How computers find things fast and put things in order, with Pengbot\'s Fish Hunt and Speedy Sort.' },
  { id: 'images-and-sound', subject: 'computing', twoPart: true, title: 'Images and Sound',
    blurb: 'How pictures and sounds are stored as numbers, and why some files are bigger than others.' },
  { id: 'networks', subject: 'computing', twoPart: true, title: 'Networks',
    blurb: "LANs, WANs, routers and switches as Pengbot connects Penguin School, then topologies, protocols and packets in Pengbot's Network Plan." },
  { id: 'digital-media', subject: 'computing', twoPart: true, title: 'Digital Media',
    blurb: "Plan and make great slides, photos and videos for Aaliyah's Big Presentation, then storyboards, file formats and editing for her Penguin Film." },
  { id: 'cyber-security', subject: 'computing', twoPart: true, title: 'Cyber Security',
    blurb: "Build a safety shield with Selma (screen locks, strong passwords, updates), then join Aaliyah's cyber defence team to stop phishing, malware and hackers." },
  { id: 'healthy-tech', subject: 'computing', twoPart: true, title: 'Healthy Tech',
    blurb: "Keep screen time in balance with Selma, then find out with Aaliyah how apps are designed to keep us hooked, and how to take back control." },
  { id: 'rules-laws-and-ethics', subject: 'computing', twoPart: true, title: 'Rules, Laws and Ethics',
    blurb: "Fair, kind tech that's good for the planet with Selma, then personal data, UK GDPR and your rights with Aaliyah the data detective." },
  { id: 'programming-languages', subject: 'computing', twoPart: true, title: 'Programming Languages and Translators',
    blurb: "Why a robot can't read blocks or English, then high-level and low-level languages, compilers, interpreters and assemblers." },
  { id: 'email-and-working-together', subject: 'computing', twoPart: true, title: 'Email and Working Together Online',
    blurb: "Send a proper email and work on a project together online with Selma and Zoe, then shared documents, version history and teamwork with Aaliyah's Penguin Times team." },
  { id: 'the-internet', subject: 'computing', title: 'The Internet',
    blurb: 'How the internet works: addresses, packets, servers, the padlock and the cloud.' },
  { id: 'online-safety', subject: 'computing', title: 'Online Safety',
    blurb: "Strong passwords, spotting tricks, and being kind online. Watch out for Sneaky Sid!" },
  { id: 'how-computers-work', subject: 'computing', title: 'How Computers Work',
    blurb: 'Inside a computer, binary, logic, databases, smart devices and AI.' },
  { id: 'thinking-and-coding', subject: 'computing', title: 'Thinking and Coding',
    blurb: 'Algorithms, computational thinking, first steps in code, and secret codes.' },
];

/** Topics that are written or filmed but not on YouTube yet. Shown as "coming soon". */
export const comingSoon: { subject: string; title: string }[] = [
  { subject: 'computing', title: 'Binary Maths and Hexadecimal' },
];

export interface Video {
  /** '' while a video is only on our own site (not on YouTube) */
  youtubeId: string;
  slug: string;
  /** the fun episode name, e.g. "Pengbot's Gadget Lab" */
  title: string;
  /** the full YouTube title */
  fullTitle: string;
  topic: string;
  keyStages: KeyStage[];
  kind: Kind;
  part?: 1 | 2 | 3;
  /** for a quiz: the slug of the lesson it goes with */
  quizFor?: string;
}

const v = (
  youtubeId: string, slug: string, title: string, fullTitle: string, topic: string,
  keyStages: KeyStage[], kind: Kind = 'lesson', part?: 1 | 2 | 3, quizFor?: string,
): Video => ({ youtubeId, slug, title, fullTitle, topic, keyStages, kind, part, quizFor });

// Listed in the order they appear on a topic page.
export const videos: Video[] = [
  // Hardware and Software
  v('Ke8PWd7seck', 'pengbots-gadget-lab', "Pengbot's Gadget Lab", "Hardware and Software (Part 1): Pengbot's Gadget Lab", 'hardware-and-software', ['ks2'], 'lesson', 1),
  v('6UIFmeG1fqQ', 'hardware-and-software-part-1-quiz', 'Hardware and Software Part 1: Bonus Quiz', 'Hardware and Software (Part 1): Bonus Quiz, 20 Questions', 'hardware-and-software', ['ks2'], 'quiz', 1, 'pengbots-gadget-lab'),
  v('NGAy6QdX2uI', 'pengbots-processor-power', "Pengbot's Processor Power", "Hardware and Software (Part 2): Pengbot's Processor Power", 'hardware-and-software', ['ks3'], 'lesson', 2),
  v('4ALvtJ_f_hs', 'hardware-and-software-part-2-quiz', 'Hardware and Software Part 2: Bonus Quiz', 'Hardware and Software (Part 2): Bonus Quiz, 20 Questions', 'hardware-and-software', ['ks3'], 'quiz', 2, 'pengbots-processor-power'),

  // Data and Spreadsheets
  v('90vNWcdU_cQ', 'pengbots-penguin-survey', "Pengbot's Penguin Survey", "Data and Spreadsheets (Part 1): Pengbot's Penguin Survey", 'data-and-spreadsheets', ['ks2'], 'lesson', 1),
  v('MI9kBwO6BCQ', 'data-and-spreadsheets-part-1-quiz', 'Data and Spreadsheets Part 1: Bonus Quiz', 'Data and Spreadsheets (Part 1): Bonus Quiz, 20 Questions', 'data-and-spreadsheets', ['ks2'], 'quiz', 1, 'pengbots-penguin-survey'),
  v('ytPI_6qTYwU', 'pengbots-fish-fest-spreadsheet', "Pengbot's Fish Fest Spreadsheet", "Data and Spreadsheets (Part 2): Pengbot's Fish Fest Spreadsheet", 'data-and-spreadsheets', ['ks3'], 'lesson', 2),
  v('OqcG8WlxqKA', 'data-and-spreadsheets-part-2-quiz', 'Data and Spreadsheets Part 2: Bonus Quiz', 'Data and Spreadsheets (Part 2): Bonus Quiz, 20 Questions', 'data-and-spreadsheets', ['ks3'], 'quiz', 2, 'pengbots-fish-fest-spreadsheet'),

  // Making Web Pages
  v('xl7Eur9VxVI', 'pengbots-penguin-website', "Pengbot's Penguin Website", "Making Web Pages (Part 1): Pengbot's Penguin Website", 'making-web-pages', ['ks2'], 'lesson', 1),
  v('7Pi-2TXsKgg', 'making-web-pages-part-1-quiz', 'Making Web Pages Part 1: Bonus Quiz', 'Making Web Pages (Part 1): Bonus Quiz, 20 Questions', 'making-web-pages', ['ks2'], 'quiz', 1, 'pengbots-penguin-website'),
  v('JHVDKSg9SFU', 'aaliyah-codes-the-penguin-times', 'Aaliyah Codes the Penguin Times', 'Making Web Pages (Part 2): Aaliyah Codes the Penguin Times', 'making-web-pages', ['ks3'], 'lesson', 2),
  v('0f2c2uEH1ww', 'making-web-pages-part-2-quiz', 'Making Web Pages Part 2: Bonus Quiz', 'Making Web Pages (Part 2): Bonus Quiz, 20 Questions', 'making-web-pages', ['ks3'], 'quiz', 2, 'aaliyah-codes-the-penguin-times'),

  // Programming
  v('6YPS8SPwU3o', 'pengbots-maze-game', "Pengbot's Maze Game", "Programming (Part 1): Pengbot's Maze Game", 'programming', ['ks2'], 'lesson', 1),
  v('', 'programming-part-1-quiz', 'Programming Part 1: Bonus Quiz', 'Programming (Part 1): Bonus Quiz, 20 Questions', 'programming', ['ks2'], 'quiz', 1, 'pengbots-maze-game'),
  v('8l_1zIuJYpM', 'pengbots-python-quest', "Pengbot's Python Quest", "Programming (Part 2): Pengbot's Python Quest", 'programming', ['ks3'], 'lesson', 2),
  v('', 'programming-part-2-quiz', 'Programming Part 2: Bonus Quiz', 'Programming (Part 2): Bonus Quiz, 20 Questions', 'programming', ['ks3'], 'quiz', 2, 'pengbots-python-quest'),
  v('', 'aaliyah-builds-a-quiz-machine', 'Aaliyah Builds a Quiz Machine', 'Programming (Part 3): Aaliyah Builds a Quiz Machine', 'programming', ['ks3'], 'lesson', 3),
  v('', 'programming-part-3-quiz', 'Programming Part 3: Bonus Quiz', 'Programming (Part 3): Bonus Quiz, 20 Questions', 'programming', ['ks3'], 'quiz', 3, 'aaliyah-builds-a-quiz-machine'),

  // Searching and Sorting
  v('IcvArHT2D3s', 'pengbots-fish-hunt', "Pengbot's Fish Hunt", "Searching and Sorting (Part 1): Pengbot's Fish Hunt", 'searching-and-sorting', ['ks2'], 'lesson', 1),
  v('', 'searching-and-sorting-part-1-quiz', 'Searching and Sorting Part 1: Bonus Quiz', 'Searching and Sorting (Part 1): Bonus Quiz, 20 Questions', 'searching-and-sorting', ['ks2'], 'quiz', 1, 'pengbots-fish-hunt'),
  v('ZF0SfsjGBpg', 'pengbots-speedy-sort', "Pengbot's Speedy Sort", "Searching and Sorting (Part 2): Pengbot's Speedy Sort", 'searching-and-sorting', ['ks3'], 'lesson', 2),
  v('', 'searching-and-sorting-part-2-quiz', 'Searching and Sorting Part 2: Bonus Quiz', 'Searching and Sorting (Part 2): Bonus Quiz, 20 Questions', 'searching-and-sorting', ['ks3'], 'quiz', 2, 'pengbots-speedy-sort'),

  // Images and Sound
  v('Teunt17P4Ks', 'pengbots-pixel-paint', "Pengbot's Pixel Paint", "Images and Sound (Part 1): Pengbot's Pixel Paint", 'images-and-sound', ['ks2', 'ks3'], 'lesson', 1),
  v('', 'images-and-sound-part-1-quiz', 'Images and Sound Part 1: Bonus Quiz', 'Images and Sound (Part 1): Bonus Quiz, 20 Questions', 'images-and-sound', ['ks2', 'ks3'], 'quiz', 1, 'pengbots-pixel-paint'),
  v('NEVdNd8jS64', 'pengbots-file-size-challenge', "Pengbot's File Size Challenge", "Images and Sound (Part 2): Pengbot's File Size Challenge", 'images-and-sound', ['ks3'], 'lesson', 2),
  v('', 'images-and-sound-part-2-quiz', 'Images and Sound Part 2: Bonus Quiz', 'Images and Sound (Part 2): Bonus Quiz, 20 Questions', 'images-and-sound', ['ks3'], 'quiz', 2, 'pengbots-file-size-challenge'),

  // Cyber Security
  v('tUNSOiKugJQ', 'selmas-safety-shield', "Selma's Safety Shield", "Cyber Security (Part 1): Selma's Safety Shield", 'cyber-security', ['ks2'], 'lesson', 1),
  v('RmPPxPe1EwE', 'cyber-security-part-1-quiz', 'Cyber Security Part 1: Bonus Quiz', 'Cyber Security (Part 1): Bonus Quiz, 20 Questions', 'cyber-security', ['ks2'], 'quiz', 1, 'selmas-safety-shield'),
  v('okLQKebmIXQ', 'aaliyah-defends-the-penguin-times', 'Aaliyah Defends the Penguin Times', 'Cyber Security (Part 2): Aaliyah Defends the Penguin Times', 'cyber-security', ['ks3'], 'lesson', 2),
  v('guDD2W97oFw', 'cyber-security-part-2-quiz', 'Cyber Security Part 2: Bonus Quiz', 'Cyber Security (Part 2): Bonus Quiz, 20 Questions', 'cyber-security', ['ks3'], 'quiz', 2, 'aaliyah-defends-the-penguin-times'),

  // Healthy Tech
  v('xa0xDj1Ypvg', 'selmas-screen-time-balance', "Selma's Screen-Time Balance", "Healthy Tech (Part 1): Selma's Screen-Time Balance", 'healthy-tech', ['ks2'], 'lesson', 1),
  v('He1qj2kViGw', 'aaliyah-takes-back-control', 'Aaliyah Takes Back Control', 'Healthy Tech (Part 2): Aaliyah Takes Back Control', 'healthy-tech', ['ks3'], 'lesson', 2),

  // Rules, Laws and Ethics
  v('not7pyH4phg', 'selmas-fair-tech-mission', "Selma's Fair Tech Mission", "Rules, Laws and Ethics (Part 1): Selma's Fair Tech Mission", 'rules-laws-and-ethics', ['ks2'], 'lesson', 1),
  v('FXeZgry7KK0', 'aaliyah-and-the-data-detectives', 'Aaliyah and the Data Detectives', 'Rules, Laws and Ethics (Part 2): Aaliyah and the Data Detectives', 'rules-laws-and-ethics', ['ks3'], 'lesson', 2),

  // Programming Languages and Translators
  v('klzacqNAIlo', 'selmas-robot-translator', "Selma's Robot Translator", "Programming Languages and Translators (Part 1): Selma's Robot Translator", 'programming-languages', ['ks2'], 'lesson', 1),
  v('chztg3hodyw', 'aaliyahs-game-goes-pocket-sized', "Aaliyah's Game Goes Pocket-Sized", "Programming Languages and Translators (Part 2): Aaliyah's Game Goes Pocket-Sized", 'programming-languages', ['ks3'], 'lesson', 2),
  v('3-FHJFBxB7k', 'one-job-three-languages', 'One Job, Three Languages', 'One job, three languages', 'programming-languages', ['ks3'], 'short'),

  // Email and Working Together Online (on our site only for now, not on YouTube yet)
  v('', 'selma-and-zoes-penguin-project', "Selma and Zoe's Penguin Project", "Email and Working Together Online (Part 1): Selma and Zoe's Penguin Project", 'email-and-working-together', ['ks2'], 'lesson', 1),
  v('', 'aaliyahs-penguin-times-team', "Aaliyah's Penguin Times Team", "Email and Working Together Online (Part 2): Aaliyah's Penguin Times Team", 'email-and-working-together', ['ks3'], 'lesson', 2),

  // Networks
  v('x3e-MBmUvjE', 'pengbot-connects-penguin-school', 'Pengbot Connects Penguin School', 'Networks (Part 1): Pengbot Connects Penguin School', 'networks', ['ks2'], 'lesson', 1),
  v('jKL2YtCpV5E', 'networks-part-1-quiz', 'Networks Part 1: Bonus Quiz', 'Networks (Part 1): Bonus Quiz, 20 Questions', 'networks', ['ks2'], 'quiz', 1, 'pengbot-connects-penguin-school'),
  v('3jv8BB3_WuU', 'pengbots-network-plan', "Pengbot's Network Plan", "Networks (Part 2): Pengbot's Network Plan", 'networks', ['ks3'], 'lesson', 2),
  v('akVu-sv3drQ', 'networks-part-2-quiz', 'Networks Part 2: Bonus Quiz', 'Networks (Part 2): Bonus Quiz, 20 Questions', 'networks', ['ks3'], 'quiz', 2, 'pengbots-network-plan'),

  // Digital Media
  v('R6hjvvp0CXI', 'aaliyahs-big-presentation', "Aaliyah's Big Presentation", "Digital Media (Part 1): Aaliyah's Big Presentation", 'digital-media', ['ks2'], 'lesson', 1),
  v('LNxg-vI0t9w', 'digital-media-part-1-quiz', 'Digital Media Part 1: Bonus Quiz', 'Digital Media (Part 1): Bonus Quiz, 20 Questions', 'digital-media', ['ks2'], 'quiz', 1, 'aaliyahs-big-presentation'),
  v('dapIIVf1d6s', 'aaliyahs-penguin-film', "Aaliyah's Penguin Film", "Digital Media (Part 2): Aaliyah's Penguin Film", 'digital-media', ['ks3'], 'lesson', 2),
  v('8oFK9TJdJic', 'digital-media-part-2-quiz', 'Digital Media Part 2: Bonus Quiz', 'Digital Media (Part 2): Bonus Quiz, 20 Questions', 'digital-media', ['ks3'], 'quiz', 2, 'aaliyahs-penguin-film'),

  // The Internet
  v('Ng3VuGsd3HI', 'what-is-the-internet', "What Is the Internet? The Internet's Big Address Book", "What Is the Internet? The Internet's Big Address Book", 'the-internet', ['ks2']),
  v('CWalMmrOUos', 'the-great-packet-puzzle', 'Packets: The Great Packet Puzzle', 'Packets: The Great Packet Puzzle', 'the-internet', ['ks2']),
  v('DRdNJPKvCq0', 'ip-addresses', 'IP Addresses: The Amazing Address Adventure', 'IP Addresses: The Amazing Address Adventure', 'the-internet', ['ks2', 'ks3']),
  v('i4-fBLV9jVI', 'the-server-cafe', 'Clients, Servers and Bandwidth: The Server Café', 'Clients, Servers and Bandwidth: The Server Café', 'the-internet', ['ks2']),
  v('ZSmHxN0TzP0', 'http-vs-https', 'HTTP vs HTTPS: The Secret of the Little Padlock', 'HTTP vs HTTPS: The Secret of the Little Padlock', 'the-internet', ['ks2', 'ks3']),
  v('61KwELxUN5w', 'why-the-internet-chops-your-photo', 'Why the Internet Chops Your Photo into Pieces', 'Why the internet chops your photo into pieces', 'the-internet', ['ks2'], 'short'),
  v('vmMqH4lty9s', 'the-cloud', "The Cloud: Where Do Aaliyah's Photos Live?", "The Cloud: Where Do Aaliyah's Photos Live?", 'the-internet', ['ks2', 'ks3']),

  // Online Safety
  v('wsLwXcsIh_Q', 'the-password-fortress', 'Passwords: The Password Fortress', 'Passwords: The Password Fortress', 'online-safety', ['ks2', 'ks3']),
  v('fF_ZUNHlsJ4', 'the-3-random-words-trick', 'The 3 Random Words Trick', 'The 3 random words trick', 'online-safety', ['ks2', 'ks3'], 'short'),
  v('svQ8Go59NP8', 'sneaky-sid-goes-phishing', 'Sneaky Sid Goes Phishing', 'Sneaky Sid Goes Phishing', 'online-safety', ['ks2', 'ks3']),
  v('5afQYE2SMHA', 'real-email-or-phish', 'Real Email or Phish?', 'Real email or phish?', 'online-safety', ['ks2', 'ks3'], 'short'),
  v('KpiiuASVmZs', 'sneaky-sids-free-coins-trick', "Malware: Sneaky Sid's Free Coins Trick", "Malware: Sneaky Sid's Free Coins Trick", 'online-safety', ['ks2', 'ks3']),
  v('73geU5e61eE', 'digital-footprints', 'Digital Footprints: Think Before You Post', 'Digital Footprints: Think Before You Post', 'online-safety', ['ks2', 'ks3']),
  v('JKQqqtMPfXs', 'being-kind-online', 'Being Kind Online: Online Superheroes', 'Being Kind Online: Online Superheroes', 'online-safety', ['ks2', 'ks3']),
  v('MHrgiBRdsk8', 'whos-really-online', "Who's Really Online? Sneaky Sid's Penguin Disguise", "Who's Really Online? Sneaky Sid's Penguin Disguise", 'online-safety', ['ks2', 'ks3']),
  v('0-_M6RgrG5Q', 'search-and-fake-news', "Search and Fake News: Sneaky Sid's Flying Penguin", "Search and Fake News: Sneaky Sid's Flying Penguin", 'online-safety', ['ks2']),

  // How Computers Work
  v('GaxMJXn0XJg', 'inside-a-computer', 'Inside a Computer: The Busy Computer Kitchen', 'Inside a Computer: The Busy Computer Kitchen', 'how-computers-work', ['ks3']),
  v('JswaC-hCSHw', 'pengbots-light-switches', "Binary: Pengbot's Light Switches", "Binary: Pengbot's Light Switches", 'how-computers-work', ['ks3']),
  v('WJIP1kRGqwA', 'pengbots-secret-door', "Logic and Boolean: Pengbot's Secret Door", "Logic and Boolean: Pengbot's Secret Door", 'how-computers-work', ['ks3']),
  v('eNFkJq6yQ8s', 'the-super-sorted-library', 'Databases: The Super-Sorted Library', 'Databases: The Super-Sorted Library', 'how-computers-work', ['ks3']),
  v('1WO2hbf64to', 'pengbots-smart-home', "Smart Devices: Pengbot's Smart Home", "Smart Devices: Pengbot's Smart Home", 'how-computers-work', ['ks2', 'ks3']),
  v('IBtX1WTtz9Q', 'how-does-pengbot-learn', 'AI: How Does Pengbot Learn?', 'AI: How Does Pengbot Learn?', 'how-computers-work', ['ks2', 'ks3']),

  // Thinking and Coding
  v('mczfBLpcG7E', 'the-robot-sandwich', 'Algorithms: The Robot Sandwich', 'Algorithms: The Robot Sandwich', 'thinking-and-coding', ['ks2', 'ks3']),
  v('PfI6IpVir5g', 'pengbots-sports-day', "Computational Thinking: Pengbot's Sports Day", "Computational Thinking: Pengbot's Sports Day", 'thinking-and-coding', ['ks2', 'ks3']),
  v('EJWU5xTzBXs', 'pengbot-learns-to-code', 'Programming: Pengbot Learns to Code', 'Programming: Pengbot Learns to Code', 'thinking-and-coding', ['ks2', 'ks3']),
  v('_SEH7yVx70Y', 'sneaky-sid-and-the-surprise-party', 'Secret Codes: Sneaky Sid and the Surprise Party', 'Secret Codes: Sneaky Sid and the Surprise Party', 'thinking-and-coding', ['ks2', 'ks3']),
];

// Newest uploads first, in the order YouTube lists them.
export const newestFirst: string[] = [
  'one-job-three-languages', 'aaliyahs-game-goes-pocket-sized', 'selmas-robot-translator',
  'aaliyah-and-the-data-detectives', 'selmas-fair-tech-mission', 'aaliyah-takes-back-control', 'selmas-screen-time-balance',
  'cyber-security-part-2-quiz', 'aaliyah-defends-the-penguin-times', 'cyber-security-part-1-quiz', 'selmas-safety-shield',
  'digital-media-part-2-quiz', 'aaliyahs-penguin-film', 'digital-media-part-1-quiz', 'aaliyahs-big-presentation',
  'networks-part-2-quiz', 'pengbots-network-plan', 'networks-part-1-quiz', 'pengbot-connects-penguin-school',
  'why-the-internet-chops-your-photo', 'making-web-pages-part-2-quiz', 'aaliyah-codes-the-penguin-times',
  'making-web-pages-part-1-quiz', 'pengbots-penguin-website', 'data-and-spreadsheets-part-2-quiz',
  'pengbots-fish-fest-spreadsheet', 'real-email-or-phish', 'data-and-spreadsheets-part-1-quiz',
  'pengbots-penguin-survey', 'hardware-and-software-part-2-quiz', 'pengbots-processor-power',
];

// ---------- helpers ----------
export const topicById = (id: string) => topics.find((t) => t.id === id)!;
export const subjectById = (id: string) => subjects.find((s) => s.id === id)!;
export const videoBySlug = (slug: string) => videos.find((x) => x.slug === slug)!;
export const videosInTopic = (topicId: string) => videos.filter((x) => x.topic === topicId);
export const topicsFor = (subjectId: string, ks?: KeyStage) =>
  topics.filter((t) => t.subject === subjectId && (!ks || videosInTopic(t.id).some((x) => x.keyStages.includes(ks))));
export const ksLabel = (ks: KeyStage[]) => ks.map((k) => k.toUpperCase()).join(' & ');
/** YouTube's picture while a video is on YouTube, otherwise our own poster. */
export const thumb = (v: Video) => (v.youtubeId ? `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg` : `/posters/${v.slug}.jpg`);
export const quizzes = videos.filter((x) => x.kind === 'quiz');
export const lessonCount = (subjectId: string) =>
  videos.filter((x) => topicById(x.topic).subject === subjectId && x.kind !== 'quiz').length;

// ---------- memberships ----------
/** Free for everyone: every Short, every Online Safety lesson, and the first lesson of each topic. */
export const isFree = (v: Video): boolean =>
  v.kind === 'short' || v.topic === 'online-safety' || videosInTopic(v.topic).find((x) => x.kind === 'lesson') === v;
