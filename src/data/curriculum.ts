// National Curriculum in England: computing programmes of study (Department for Education).
// Contains public sector information licensed under the Open Government Licence v3.0.
//
// The statements below are the official KS2 and KS3 subject content, with a short label of our own.
// Which videos cover which statements comes from the "National Curriculum.txt" file in each video
// folder (read by `npm run curriculum` into curriculum.json).
import data from './curriculum.json';
import { videoBySlug, type KeyStage, type Video } from './catalogue';

export interface Statement { id: string; ks: 'KS2' | 'KS3'; short: string; text: string }

export const STATEMENTS: Statement[] = [
  { id: 'ks2-programs', ks: 'KS2', short: 'Design, write and debug programs',
    text: 'design, write and debug programs that accomplish specific goals, including controlling or simulating physical systems; solve problems by decomposing them into smaller parts' },
  { id: 'ks2-sequence', ks: 'KS2', short: 'Sequence, selection, repetition and variables',
    text: 'use sequence, selection, and repetition in programs; work with variables and various forms of input and output' },
  { id: 'ks2-reasoning', ks: 'KS2', short: 'Explaining algorithms and fixing errors',
    text: 'use logical reasoning to explain how some simple algorithms work and to detect and correct errors in algorithms and programs' },
  { id: 'ks2-networks', ks: 'KS2', short: 'Networks and the internet',
    text: 'understand computer networks including the internet; how they can provide multiple services, such as the world wide web; and the opportunities they offer for communication and collaboration' },
  { id: 'ks2-search', ks: 'KS2', short: 'Searching well and judging what you find',
    text: 'use search technologies effectively, appreciate how results are selected and ranked, and be discerning in evaluating digital content' },
  { id: 'ks2-software', ks: 'KS2', short: 'Using software to create and present',
    text: 'select, use and combine a variety of software (including internet services) on a range of digital devices to design and create a range of programs, systems and content that accomplish given goals, including collecting, analysing, evaluating and presenting data and information' },
  { id: 'ks2-safety', ks: 'KS2', short: 'Using technology safely and respectfully',
    text: 'use technology safely, respectfully and responsibly; recognise acceptable/unacceptable behaviour; identify a range of ways to report concerns about content and contact' },
  { id: 'ks3-abstraction', ks: 'KS3', short: 'Abstraction and modelling',
    text: 'design, use and evaluate computational abstractions that model the state and behaviour of real-world problems and physical systems' },
  { id: 'ks3-algorithms', ks: 'KS3', short: 'Key algorithms, including searching and sorting',
    text: 'understand several key algorithms that reflect computational thinking [for example, ones for sorting and searching]; use logical reasoning to compare the utility of alternative algorithms for the same problem' },
  { id: 'ks3-languages', ks: 'KS3', short: 'Programming in two or more languages',
    text: 'use 2 or more programming languages, at least one of which is textual, to solve a variety of computational problems; make appropriate use of data structures [for example, lists, tables or arrays]; design and develop modular programs that use procedures or functions' },
  { id: 'ks3-boolean', ks: 'KS3', short: 'Boolean logic and binary numbers',
    text: 'understand simple Boolean logic [for example, AND, OR and NOT] and some of its uses in circuits and programming; understand how numbers can be represented in binary, and be able to carry out simple operations on binary numbers [for example, binary addition, and conversion between binary and decimal]' },
  { id: 'ks3-systems', ks: 'KS3', short: 'Hardware, software and how systems communicate',
    text: 'understand the hardware and software components that make up computer systems, and how they communicate with one another and with other systems' },
  { id: 'ks3-data', ks: 'KS3', short: 'How computers run instructions and store data',
    text: 'understand how instructions are stored and executed within a computer system; understand how data of various types (including text, sounds and pictures) can be represented and manipulated digitally, in the form of binary digits' },
  { id: 'ks3-projects', ks: 'KS3', short: 'Creative digital projects',
    text: 'undertake creative projects that involve selecting, using, and combining multiple applications, preferably across a range of devices, to achieve challenging goals, including collecting and analysing data and meeting the needs of known users' },
  { id: 'ks3-artefacts', ks: 'KS3', short: 'Creating digital content for an audience',
    text: 'create, re-use, revise and re-purpose digital artefacts for a given audience, with attention to trustworthiness, design and usability' },
  { id: 'ks3-safety', ks: 'KS3', short: 'Staying safe, secure and private online',
    text: 'understand a range of ways to use technology safely, respectfully, responsibly and securely, including protecting their online identity and privacy; recognise inappropriate content, contact and conduct, and know how to report concerns' },
];

export const SOURCE = 'National Curriculum in England: computing programmes of study (Department for Education). Contains public sector information licensed under the Open Government Licence v3.0.';
export const SOURCE_URL = 'https://www.gov.uk/government/publications/national-curriculum-in-england-computing-programmes-of-study';

// Match a statement quoted in a video's notes to the official list (by its opening words,
// so small differences in punctuation don't matter).
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 8).join(' ');
const byKey = new Map(STATEMENTS.map((s) => [`${s.ks} ${key(s.text)}`, s]));

interface Raw { stages: string[]; summary: string; points: { ks: string; text: string }[] }
export interface VideoCurriculum { stages: string[]; summary: string; statements: Statement[] }

const perVideo = new Map<string, VideoCurriculum>();
for (const [slug, raw] of Object.entries(data as Record<string, Raw>)) {
  const statements = raw.points
    .map((p) => byKey.get(`${p.ks} ${key(p.text)}`))
    .filter((s): s is Statement => Boolean(s));
  perVideo.set(slug, { stages: raw.stages, summary: raw.summary, statements: [...new Set(statements)] });
}

export const curriculumFor = (slug: string) => perVideo.get(slug) ?? null;

/** Every lesson (not quizzes or Shorts) that covers a statement, in catalogue order. */
export function lessonsCovering(id: string): Video[] {
  const out: Video[] = [];
  for (const [slug, c] of perVideo) {
    if (!c.statements.some((s) => s.id === id)) continue;
    const v = videoBySlug(slug);
    if (v && v.kind === 'lesson') out.push(v);
  }
  return out;
}

export const statementsFor = (ks: KeyStage) => STATEMENTS.filter((s) => s.ks.toLowerCase() === ks);
