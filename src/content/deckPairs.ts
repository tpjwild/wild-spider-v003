/**
 * Deck pair registry. **Face** portraits: medium `public/gameArt/portraits/`, small `public/gameArt/portraits-small/`.
 * **Shared** backs and pip faces: `public/gameArt/shared/` — see `sharedDeckAssets.ts` and `gameArtPaths.ts`.
 * Missing files are handled in the UI (gradient / typography fallbacks); assets are optional in the repo.
 *
 * **pairCode:** exactly three characters `[A-Z0-9]`, immutable per pair — used in formatted game seeds.
 */
import {
  baseCourtPortraitBasename,
  gameArtPortraitThumbUrl,
  gameArtPortraitUrl,
  sharedCourtFramePath,
  sharedJokerFramePathFromPortraitBasename,
} from "@/constants/gameArtPaths";
import {
  JOKER_POWER_ALL_KINGS_TRANSPARENT,
  JOKER_POWER_SELECTED_CARD_TRANSPARENT,
} from "@/content/powerDefinitions";
import { THEMED_COURT_PORTRAITS, THEMED_JOKER_PORTRAITS } from "@/content/portraitManifest";
import type { PowerId, Suit } from "@/engine/types";
import { sharedDeckCardBackPath, sharedDeckFramePath } from "@/constants/sharedDeckAssets";

export type DeckPairId = string;

/** Jack, Queen, or King within a deck. */
export type DeckFaceRank = 11 | 12 | 13;

export type DeckFaceCard = {
  suit: Suit;
  rank: DeckFaceRank;
  name: string;
  bio: string;
  /** Medium WebP/SVG — card details popup. */
  portraitPath: string;
  /** Small WebP/SVG — in-game card faces (tableau, foundation, shelf, deck popup). */
  portraitThumbPath: string;
  framePath: string;
};

export type DeckJokerCard = {
  /** Slot 1–4 within this deck (red/black pairs in themed art filenames). */
  index: 1 | 2 | 3 | 4;
  /** Power triggered from the shelf (see `content/powerDefinitions.ts`). */
  powerId: PowerId;
  /** Charges when the joker is first placed on the shelf. */
  initialCharges: number;
  name: string;
  bio: string;
  portraitPath: string;
  portraitThumbPath: string;
  framePath: string;
};

export type DeckInPair = {
  /** Short label for UI (e.g. era or sub-theme). */
  label: string;
  cardBackPath: string;
  /** Up to four per deck; Base ships with none. */
  jokers: readonly DeckJokerCard[];
  /** Exactly twelve: J, Q, K for each suit S, C, D, H. */
  faces: readonly DeckFaceCard[];
};

export type SuitTheme = {
  suit: Suit;
  name: string;
  description: string;
};

export type DeckPairDefinition = {
  id: DeckPairId;
  /** Menu and seed display name. */
  name: string;
  pairCode: string;
  /** High-level theme title for the pair (see product spec). */
  deckPairTheme: string;
  /** Optional prose for Deck Pair Details. */
  deckPairBlurb?: string;
  /**
   * When false, the pair stays locked until achievements unlock it (Stage 6).
   * Stage 4 ships all defined pairs unlocked by default.
   */
  defaultUnlocked: boolean;
  /** One entry per suit S, C, D, H (order matches Deck Popup rows). */
  suitThemes: readonly [SuitTheme, SuitTheme, SuitTheme, SuitTheme];
  decks: readonly [DeckInPair, DeckInPair];
};

const SUITS_ORDER: readonly Suit[] = ["S", "C", "D", "H"];

export function rankSuitImageStem(rank: DeckFaceRank, suit: Suit): string {
  const rankLetter = rank === 11 ? "J" : rank === 12 ? "Q" : "K";
  return `${rankLetter}${suit}`;
}

/** @deprecated Legacy path pattern; courts use {@link gameArtPortraitUrl} + manifest basenames. */
export function deckFacePortraitPath(
  deckPairId: string,
  deckNum: 1 | 2,
  rank: DeckFaceRank,
  suit: Suit,
): string {
  return gameArtPortraitUrl(deckPairId, deckNum, `${rankSuitImageStem(rank, suit)}.webp`);
}

/** @deprecated Pair id ignored — use {@link sharedDeckCardBackPath} from `sharedDeckAssets`. */
export function deckCardBackPath(_deckPairId: string, deckNum: 1 | 2): string {
  return sharedDeckCardBackPath(deckNum);
}

/** @deprecated Use per-card frames from `gameArtPaths.sharedCourtFramePath`. */
export function deckFramePath(_deckPairId: string, _deckNum: 1 | 2): string {
  return sharedDeckFramePath();
}

/** @deprecated Joker art is per pair under `gameArt/portraits/`. */
export function deckJokerPortraitPath(
  _deckPairId: string,
  _deckNum: 1 | 2,
  _jokerIndex: 1 | 2 | 3 | 4,
): string {
  return "";
}

type ThemedPairId = "computerScience" | "mathematics" | "westernPhilosophy";

function courtPortraitKey(pairId: ThemedPairId, deck: 1 | 2, suit: Suit, rank: DeckFaceRank): string {
  return `${pairId}:${deck}:${suit}:${rank}`;
}

type ThemedFaceSuitRow = {
  jBio: string;
  qBio: string;
  kBio: string;
};

type ThemedFacesArgs = {
  pairId: ThemedPairId;
  deck: 1 | 2;
  faces: Record<Suit, ThemedFaceSuitRow>;
};

function themedFaces({ pairId, deck, faces: bySuit }: ThemedFacesArgs): readonly DeckFaceCard[] {
  const out: DeckFaceCard[] = [];
  for (const suit of SUITS_ORDER) {
    const row = bySuit[suit];
    const triple: readonly [DeckFaceRank, string][] = [
      [11, row.jBio],
      [12, row.qBio],
      [13, row.kBio],
    ];
    for (const [rank, bio] of triple) {
      const key = courtPortraitKey(pairId, deck, suit, rank);
      const m = THEMED_COURT_PORTRAITS[key];
      if (!m) throw new Error(`Missing themed court portrait manifest entry: ${key}`);
      out.push({
        suit,
        rank,
        name: m.name,
        bio,
        portraitPath: gameArtPortraitUrl(pairId, deck, m.file),
        portraitThumbPath: gameArtPortraitThumbUrl(pairId, deck, m.file),
        framePath: sharedCourtFramePath(rank, suit),
      });
    }
  }
  return out;
}

function baseFaces(
  deckNum: 1 | 2,
  bySuit: Record<Suit, { j: string; jBio: string; q: string; qBio: string; k: string; kBio: string }>,
): readonly DeckFaceCard[] {
  const out: DeckFaceCard[] = [];
  for (const suit of SUITS_ORDER) {
    const row = bySuit[suit];
    const triple: readonly [DeckFaceRank, string, string][] = [
      [11, row.j, row.jBio],
      [12, row.q, row.qBio],
      [13, row.k, row.kBio],
    ];
    for (const [rank, name, bio] of triple) {
      const basename = baseCourtPortraitBasename(deckNum, rank, suit);
      out.push({
        suit,
        rank,
        name,
        bio,
        portraitPath: gameArtPortraitUrl("base", deckNum, basename),
        portraitThumbPath: gameArtPortraitThumbUrl("base", deckNum, basename),
        framePath: sharedCourtFramePath(rank, suit),
      });
    }
  }
  return out;
}

/** Per joker slot 1–4: catalog bio, power, and charges; name and portrait from manifest. */
export type ThemedJokerInput = {
  bio: string;
  powerId: PowerId;
  initialCharges: number;
};

type ThemedJokersArgs = {
  pairId: ThemedPairId;
  deck: 1 | 2;
  jokers: readonly [ThemedJokerInput, ThemedJokerInput, ThemedJokerInput, ThemedJokerInput];
};

function themedJokers({ pairId, deck, jokers: defs }: ThemedJokersArgs): readonly DeckJokerCard[] {
  const out: DeckJokerCard[] = [];
  for (let i = 0; i < 4; i++) {
    const slot = (i + 1) as 1 | 2 | 3 | 4;
    const key = `${pairId}:${deck}:${slot}`;
    const portrait = THEMED_JOKER_PORTRAITS[key];
    if (!portrait) throw new Error(`Missing themed joker portrait manifest entry: ${key}`);
    const def = defs[i]!;
    out.push({
      index: slot,
      powerId: def.powerId,
      initialCharges: def.initialCharges,
      name: portrait.name,
      bio: def.bio,
      portraitPath: gameArtPortraitUrl(pairId, deck, portrait.file),
      portraitThumbPath: gameArtPortraitThumbUrl(pairId, deck, portrait.file),
      framePath: sharedJokerFramePathFromPortraitBasename(portrait.file),
    });
  }
  return out;
}

export const DEFAULT_DECK_PAIR_ID = "base";

const basePair: DeckPairDefinition = {
  id: DEFAULT_DECK_PAIR_ID,
  name: "Base",
  pairCode: "BAS",
  deckPairTheme: "Base",
  deckPairBlurb: "Neutral rectangles and text until portrait assets are wired.",
  defaultUnlocked: true,
  suitThemes: [
    {
      suit: "S",
      name: "Spades",
      description: "Default suit theme for development and tests.",
    },
    {
      suit: "C",
      name: "Clubs",
      description: "Default suit theme for development and tests.",
    },
    {
      suit: "D",
      name: "Diamonds",
      description: "Default suit theme for development and tests.",
    },
    {
      suit: "H",
      name: "Hearts",
      description: "Default suit theme for development and tests.",
    },
  ],
  decks: [
    {
      label: "Deck 1",
      cardBackPath: sharedDeckCardBackPath(1),
      jokers: [],
      faces: baseFaces(1, {
        S: {
          j: "Jack of Spades",
          jBio: "Face-card slot for Deck 1, spades.",
          q: "Queen of Spades",
          qBio: "Face-card slot for Deck 1, spades.",
          k: "King of Spades",
          kBio: "Face-card slot for Deck 1, spades.",
        },
        C: {
          j: "Jack of Clubs",
          jBio: "Face-card slot for Deck 1, clubs.",
          q: "Queen of Clubs",
          qBio: "Face-card slot for Deck 1, clubs.",
          k: "King of Clubs",
          kBio: "Face-card slot for Deck 1, clubs.",
        },
        D: {
          j: "Jack of Diamonds",
          jBio: "Face-card slot for Deck 1, diamonds.",
          q: "Queen of Diamonds",
          qBio: "Face-card slot for Deck 1, diamonds.",
          k: "King of Diamonds",
          kBio: "Face-card slot for Deck 1, diamonds.",
        },
        H: {
          j: "Jack of Hearts",
          jBio: "Face-card slot for Deck 1, hearts.",
          q: "Queen of Hearts",
          qBio: "Face-card slot for Deck 1, hearts.",
          k: "King of Hearts",
          kBio: "Face-card slot for Deck 1, hearts.",
        },
      }),
    },
    {
      label: "Deck 2",
      cardBackPath: sharedDeckCardBackPath(2),
      jokers: [],
      faces: baseFaces(2, {
        S: {
          j: "Jack of Spades (deck 2)",
          jBio: "Face-card slot for Deck 2, spades.",
          q: "Queen of Spades (deck 2)",
          qBio: "Face-card slot for Deck 2, spades.",
          k: "King of Spades (deck 2)",
          kBio: "Face-card slot for Deck 2, spades.",
        },
        C: {
          j: "Jack of Clubs (deck 2)",
          jBio: "Face-card slot for Deck 2, clubs.",
          q: "Queen of Clubs (deck 2)",
          qBio: "Face-card slot for Deck 2, clubs.",
          k: "King of Clubs (deck 2)",
          kBio: "Face-card slot for Deck 2, clubs.",
        },
        D: {
          j: "Jack of Diamonds (deck 2)",
          jBio: "Face-card slot for Deck 2, diamonds.",
          q: "Queen of Diamonds (deck 2)",
          qBio: "Face-card slot for Deck 2, diamonds.",
          k: "King of Diamonds (deck 2)",
          kBio: "Face-card slot for Deck 2, diamonds.",
        },
        H: {
          j: "Jack of Hearts (deck 2)",
          jBio: "Face-card slot for Deck 2, hearts.",
          q: "Queen of Hearts (deck 2)",
          qBio: "Face-card slot for Deck 2, hearts.",
          k: "King of Hearts (deck 2)",
          kBio: "Face-card slot for Deck 2, hearts.",
        },
      }),
    },
  ],
};

const COMPUTER_SCIENCE_ID = "computerScience" as const;

const computerSciencePair: DeckPairDefinition = {
  id: COMPUTER_SCIENCE_ID,
  name: "Computer Science",
  pairCode: "CPS",
  deckPairTheme: "Computer Science",
  deckPairBlurb:
    "Two decks for the architects of computation: theory, people, data, and the machines that run the modern world.",
  defaultUnlocked: true,
  suitThemes: [
    {
      suit: "S",
      name: "Machines, Systems & Architecture",
      description:
        "The suit of engines — processors, operating systems, programming environments, and large distributed systems that make programs run and keep hardware and software functioning at scale.",
    },
    {
      suit: "C",
      name: "Theory & Foundations",
      description:
        "The suit of abstract rules — algorithms, computability, complexity, formal languages, and proof methods that define the limits and possibilities of computation itself.",
    },
    {
      suit: "D",
      name: "Data, Communication & Information",
      description:
        "The suit of networks and signals — how information is represented, transmitted, stored, and secured so bits move reliably across noisy channels and global infrastructures.",
    },
    {
      suit: "H",
      name: "People, Interaction & Society",
      description:
        "The suit of users and communities — interfaces, collaboration, education, and social impact: systems people can use and how digital technologies transform everyday life.",
    },
  ],
  decks: [
    {
      label: "Classical",
      cardBackPath: sharedDeckCardBackPath(1),
      jokers: themedJokers({
        pairId: "computerScience",
        deck: 1,
        jokers: [
          {
            bio: "Working largely alone in Germany, Zuse built some of the first programmable binary computers, including the Z3. His machines and ideas about high-level languages showed that practical, general-purpose computation could be engineered in hardware, parallel to and partly independent of more widely known efforts elsewhere.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Backus led the team that created Fortran, one of the first widely used high-level programming languages, and later introduced Backus–Naur Form for describing syntax. His work helped bridge human intentions and machine instructions, making it easier to write complex programs and reason about language structure.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Babbage designed the Difference Engine and Analytical Engine, ambitious mechanical devices meant to automate calculation. Although never fully built in his lifetime, these designs anticipated programmable computing, with separate memory and control, making him a visionary precursor of modern computer architecture.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Wiener founded cybernetics, studying control and communication in animals and machines. His work connected feedback loops, signal processing, and information flow, influencing the development of automation, robotics, and early thinking about how systems—biological or artificial—adapt and respond to their environments.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
          },
        ],
      }),
      faces: themedFaces({
        pairId: "computerScience",
        deck: 1,
        faces: {
          S: {
            jBio:
              "Ritchie co-created the C programming language and played a key role in developing the Unix operating system. His work established tools and concepts—such as portable code, simple abstractions, and a clear interface between software and hardware—that deeply shaped modern systems programming and operating systems.",
            qBio:
              "Working with Charles Babbage’s designs, Lovelace described how a general-purpose machine could manipulate symbols according to rules, writing what is often considered the first published algorithm. She saw that such engines could go beyond arithmetic to handle patterns and even music, anticipating the idea of programmable computers.",
            kBio:
              "Von Neumann helped design some of the earliest electronic computers and articulated the stored-program architecture that still underlies most modern machines. His vision of memory, control, and processing laid out a practical blueprint for turning abstract computation into working hardware and software systems.",
          },
          C: {
            jBio:
              "McCarthy coined the term “artificial intelligence,” designed the Lisp programming language, and developed foundational ideas in symbolic AI and time-sharing. His work framed computing not just as calculation but as a domain where machines might reason, plan, and interact using formal representations of knowledge.",
            qBio:
              "Hopper helped create early compilers and popularized the idea of high-level programming languages, making code more readable and accessible. She championed the notion of “bug” and “debugging” in software and played a crucial role in moving from machine code to more human-friendly ways of instructing computers.",
            kBio:
              "Turing defined a simple idealized machine to capture the essence of computation and showed that some questions, like whether a program halts, are undecidable. His work on computability, algorithms, and codebreaking makes him one of the central founders of both theoretical computer science and modern computing.",
          },
          D: {
            jBio:
              "Diffie co-developed public-key cryptography, introducing a way for two parties to establish a shared secret over an insecure channel. This breakthrough underlies many modern security protocols, enabling secure communication and authentication on open networks without pre-shared keys.",
            qBio:
              "Better known as an actress, Lamarr co-invented a frequency-hopping technique originally intended to secure wartime radio guidance. Although not realized immediately, the idea anticipated spread-spectrum methods later used in wireless communication, making her an unexpected but important figure in the story of secure data transmission.",
            kBio:
              "Shannon founded information theory, introducing the bit and showing how to quantify information and communication capacity. He proved that reliable communication is possible over noisy channels using coding schemes, laying the mathematical groundwork for digital communication, data compression, and error-correcting codes used everywhere today.",
          },
          H: {
            jBio:
              "Engelbart envisioned computers as tools for augmenting human intellect. His famous 1968 “Mother of All Demos” introduced the mouse, hypertext, windowed interfaces, and collaborative editing, foreshadowing many aspects of modern interactive computing and networked work decades before they became commonplace.",
            qBio:
              "Working at Xerox PARC, Goldberg contributed to the development of Smalltalk, one of the earliest object-oriented languages, and helped pioneer graphical user interface concepts. Through both research and education, she shaped how people learn about programming and how they interact with computers through windows, icons, and objects.",
            kBio:
              "Dijkstra advocated for structured programming and mathematical clarity in software, insisting that programs should be reasoned about, not merely hacked together. His essays and algorithms emphasized simplicity, correctness, and elegance, profoundly influencing how generations of programmers think about writing and proving code.",
          },
        },
      }),
    },
    {
      label: "Modern",
      cardBackPath: sharedDeckCardBackPath(2),
      jokers: themedJokers({
        pairId: "computerScience",
        deck: 2,
        jokers: [
          {
            bio: "Hinton played a central role in developing deep learning, showing how neural networks with many layers could learn complex patterns from data. His work on backpropagation and representation learning helped trigger a modern AI boom, with applications from image recognition to speech and natural language processing.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Van Rossum created the Python programming language, emphasizing readability, simplicity, and a friendly community. Python’s clear syntax and batteries-included standard library have made it a go-to language for education, scripting, web development, data science, and AI, reflecting his vision of approachable, practical code.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Minsky was a leading figure in early artificial intelligence, exploring how machines might represent knowledge and reason symbolically. His ambitious, sometimes controversial ideas pushed the boundaries of what computing and cognition might mean, inspiring both breakthroughs and critiques in the history of AI research.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Stallman founded the Free Software movement, arguing that users should be free to study, modify, and share the software they run. Through the GNU project and the GPL license, he championed strong ethical and legal frameworks for software freedom, influencing open-source culture worldwide.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
          },
        ],
      }),
      faces: themedFaces({
        pairId: "computerScience",
        deck: 2,
        faces: {
          S: {
            jBio:
              "Torvalds initiated the Linux kernel and fostered its development as an open-source project. Linux has become a foundation for servers, embedded systems, and many other platforms, demonstrating how collaborative, distributed development can produce robust, widely deployed operating systems.",
            qBio:
              "Liskov pioneered ideas in programming languages and distributed systems, including the Liskov substitution principle and the CLU language. Her work on abstraction, data types, and fault-tolerant replication shaped how large, complex software systems are designed, specified, and kept reliable over time.",
            kBio:
              "Thompson co-created the Unix operating system and the B programming language, helping define the structure of modern multi-user, multitasking systems. His work on simple, composable tools and clear abstractions influenced generations of operating systems and command-line environments.",
          },
          C: {
            jBio:
              "Cook introduced the notion of NP-completeness, proving that the satisfiability problem is NP-complete and opening a vast field of research on computational complexity. His work crystallized the central P versus NP question, highlighting the deep divide between problems that are easy to check and those easy to solve.",
            qBio:
              "Goldwasser made fundamental contributions to cryptography and complexity theory, including work on probabilistic encryption, zero-knowledge proofs, and interactive proofs. Her results showed how randomness and interaction can provide strong security guarantees, reshaping how theorists think about privacy, verification, and computational hardness.",
            kBio:
              "Knuth’s multi-volume The Art of Computer Programming systematically analyzes algorithms and data structures, emphasizing both correctness and efficiency. He helped establish algorithm analysis as a rigorous discipline and popularized literate programming, treating code and explanation together as a kind of mathematical literature.",
          },
          D: {
            jBio:
              "O’Sullivan led research at Australia’s CSIRO that developed techniques for detecting faint radio signals, work that later underpinned core Wi-Fi technologies. His contributions helped make fast, reliable wireless networking practical, enabling the everyday experience of connecting devices without cables.",
            qBio:
              "Perlman designed the Spanning Tree Protocol and made key contributions to network routing and robustness. Her work helps ensure that data packets can find paths through complex, redundant networks without getting trapped in loops, making large-scale communication infrastructures more stable and resilient.",
            kBio:
              "Cerf co-designed the TCP/IP protocols that underpin the internet, enabling diverse networks to interconnect and route data reliably. Often called a “father of the internet,” he helped establish the layered architecture that allows information to move flexibly between machines across the globe.",
          },
          H: {
            jBio:
              "Wales co-founded Wikipedia, an open, collaboratively written encyclopedia that harnesses contributions from volunteers worldwide. The project illustrates how networked communities and simple editing tools can create and maintain a vast, constantly evolving store of shared knowledge on the web.",
            qBio:
              "Hamilton led the team that developed onboard flight software for NASA’s Apollo missions, coining the term “software engineering” to emphasize disciplined development. Her work on reliability and error handling helped keep astronauts safe, demonstrating how careful coding practices can have life-or-death consequences in real systems.",
            kBio:
              "Berners-Lee invented the World Wide Web, designing URLs, HTTP, and HTML to make information easily shareable across the internet. His vision of a decentralized, open hypertext system transformed how people access, publish, and connect information, profoundly reshaping communication, knowledge, and everyday life.",
          },
        },
      }),
    },
  ],
};

const MATHEMATICS_ID = "mathematics" as const;

const mathematicsPair: DeckPairDefinition = {
  id: MATHEMATICS_ID,
  name: "Mathematics",
  pairCode: "MAT",
  deckPairTheme: "Mathematics",
  deckPairBlurb:
    "Two decks celebrating figures who shaped how we count, prove, model, and compute — from classical geometry to modern abstraction.",
  defaultUnlocked: true,
  suitThemes: [
    {
      suit: "S",
      name: "Space, Infinity & Higher Worlds",
      description:
        "The suit of space and infinity — geometry, topology, and higher dimensions: how space can curve, split, or extend to infinity, and how such worlds can still be understood.",
    },
    {
      suit: "C",
      name: "Logic & Foundations",
      description:
        "The suit of rigor — logic, axioms, set theory, and abstract frameworks that clarify what counts as a valid proof, which objects we assume exist, and how different areas of math hang together.",
    },
    {
      suit: "D",
      name: "Number, Algebra & Discrete Structure",
      description:
        "The suit of pattern — primes, equations, symmetries, combinatorics, and algebraic relations that reveal hidden structure in arithmetic and abstract systems underlying codes and crystals.",
    },
    {
      suit: "H",
      name: "Continuum, Change & the Physical World",
      description:
        "The suit of motion and reality — calculus, analysis, and differential equations for describing continuous change: motion, waves, fluids, and orbits through limits and functions.",
    },
  ],
  decks: [
    {
      label: "Classical",
      cardBackPath: sharedDeckCardBackPath(1),
      jokers: themedJokers({
        pairId: "mathematics",
        deck: 1,
        jokers: [
          {
            bio: "Galois died at twenty after a duel, leaving behind notes that founded group theory and transformed algebra. His insights revealed how the symmetries of polynomial equations determine whether they can be solved by radicals, opening a new realm of abstract structure born from a brief, turbulent life.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Cantor created set theory and showed that some infinities are strictly larger than others, distinguishing, for example, between countable and uncountable sets. His work initially faced strong resistance but ultimately reshaped modern mathematics, providing a language and framework for talking rigorously about infinite collections.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Zeno is famous for paradoxes that challenge our understanding of motion and infinity, such as Achilles never overtaking the tortoise. By turning simple assumptions into contradictions, he forced later thinkers to refine their notions of space, time, and continuity in more subtle mathematical ways.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Half legendary, Pythagoras and his followers saw numbers and ratios as the key to understanding harmony and the cosmos. Their discovery of irrational magnitudes unsettled earlier beliefs about number and proportion, setting the stage for deeper investigations into the foundations and limits of arithmetic.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
          },
        ],
      }),
      faces: themedFaces({
        pairId: "mathematics",
        deck: 1,
        faces: {
          S: {
            jBio:
              "Laplace developed a powerful mathematical theory of celestial mechanics, explaining planetary motions and perturbations with differential equations and probability. He envisioned a universe governed by deterministic laws, where, in principle, complete knowledge of the present could reveal both past and future states of the cosmos.",
            qBio:
              "Largely self-taught, Somerville synthesized advanced work in celestial mechanics and physical science for a broader audience. Her writings helped connect mathematical theories of space, gravitation, and light to the emerging picture of the cosmos, demonstrating how abstract analysis could illuminate the structure of the universe.",
            kBio:
              "Riemann revolutionized geometry by introducing curved manifolds, providing the framework later used in general relativity. He also made deep contributions to complex analysis and number theory, including the famous Riemann Hypothesis, reshaping how mathematicians think about space, shape, and the infinite.",
          },
          C: {
            jBio:
              "Leibniz independently developed calculus and introduced much of the notation still used today. He envisioned a universal symbolic language for reasoning and contributed deeply to logic and metaphysics, aiming to systematize thought itself in a way that anticipated later formal approaches to mathematics.",
            qBio:
              "A pioneering 19th-century mathematician, Kovalevskaya made significant contributions to analysis and partial differential equations, including work on the rotation of rigid bodies. As one of the first women to hold a full professorship in mathematics, she also symbolizes the struggle for inclusion in academic life.",
            kBio:
              "Euclid’s Elements organized Greek geometry into a clear axiomatic system of definitions, postulates, and proofs. For centuries it served as the model of rigorous mathematical reasoning, showing how complex results can be built step by step from simple assumptions about points, lines, and planes.",
          },
          D: {
            jBio:
              "Lagrange recast mechanics in a highly mathematical form, using the calculus of variations to describe motion through energy and constraints. His work on equations and series also enriched algebra and analysis, showing how structural and dynamical ideas could reinforce each other in mathematical physics.",
            qBio:
              "Working largely in isolation due to barriers against women, Germain advanced number theory, including partial progress on Fermat’s Last Theorem, and made important contributions to the theory of elasticity. Her persistence and insight secured her a lasting place in the history of pure mathematics.",
            kBio:
              "Often called the “prince of mathematicians,” Gauss made foundational contributions to number theory, algebra, geometry, and analysis. His Disquisitiones Arithmeticae reshaped the study of integers and congruences, revealing deep patterns in primes and modular arithmetic that continue to influence mathematics today.",
          },
          H: {
            jBio:
              "Cauchy helped put calculus on a rigorous footing, clarifying concepts like limit, continuity, and convergence. His theorems in analysis and complex variables set standards for precision and proof, turning intuitive ideas about change into a carefully structured, logically secure theory of functions.",
            qBio:
              "Nightingale transformed hospital care and public health by using careful statistics and graphical displays to reveal patterns in mortality and disease. Her famous charts made abstract numbers vivid, demonstrating how quantitative analysis could drive real-world reform and save lives in concrete, measurable ways.",
            kBio:
              "Newton co-invented calculus and used it to formulate laws of motion and universal gravitation, linking algebraic equations with physical forces. His work showed how continuous change—accelerating bodies, planetary orbits, falling apples—could be precisely described by differential equations and geometric reasoning.",
          },
        },
      }),
    },
    {
      label: "Modern",
      cardBackPath: sharedDeckCardBackPath(2),
      jokers: themedJokers({
        pairId: "mathematics",
        deck: 2,
        jokers: [
          {
            bio: "Erdős was an extraordinarily prolific and eccentric mathematician who collaborated with hundreds of others. He helped develop modern combinatorics and the probabilistic method, showing how randomness can prove the existence of intricate structures, and became legendary for his restless travel and love of problem-posing.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Mandelbrot developed fractal geometry to describe rough, irregular shapes in nature, from coastlines to clouds. The Mandelbrot set, a simple formula generating endlessly complex patterns, became an icon of mathematical beauty and chaos, demonstrating how feedback and iteration create intricate structure from elementary rules.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Gödel’s incompleteness theorems showed that any sufficiently strong formal system cannot prove all truths about arithmetic within itself. His work revealed inherent limits to axiomatic methods, transforming our understanding of logic, consistency, and what mathematics can, and cannot, fully capture.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Banach helped create functional analysis, studying infinite-dimensional spaces of functions now called Banach spaces. His work on norms, linear operators, and series provided tools to understand continuity and convergence in very abstract settings, reshaping modern analysis and the geometry of function spaces.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
          },
        ],
      }),
      faces: themedFaces({
        pairId: "mathematics",
        deck: 2,
        faces: {
          S: {
            jBio:
              "Smale’s work in topology and dynamical systems, including the famous “horseshoe” map, illuminated how deterministic systems can exhibit chaotic behavior. He explored the global structure of solutions in high-dimensional spaces, showing how stretching and folding can produce richly complicated patterns from simple rules.",
            qBio:
              "The first woman to win the Fields Medal, Mirzakhani studied hyperbolic geometry, Riemann surfaces, and their moduli spaces. Her work revealed intricate connections between the shapes of surfaces and dynamical behavior, deepening our understanding of complex geometric worlds far beyond everyday intuition.",
            kBio:
              "Poincaré made foundational contributions to topology, dynamical systems, and celestial mechanics. He introduced qualitative methods for studying differential equations and the global shape of spaces, helping to create the modern view of geometry and chaos where the structure of trajectories matters as much as explicit formulas.",
          },
          C: {
            jBio:
              "Church developed the lambda calculus and investigated the limits of effective computation, contributing to the Church–Turing thesis. His work in logic and foundations clarified what it means for a function to be computable, influencing both mathematical logic and the later development of computer science.",
            qBio:
              "Cartwright made important contributions to nonlinear differential equations and early chaos theory, studying how small changes can lead to complex behavior in dynamical systems. Her work illuminated the subtle structure of solutions to real-world equations and helped lay groundwork for the modern theory of chaos.",
            kBio:
              "Hilbert championed the axiomatic method and set an ambitious program to secure mathematics by proving its consistency. Though that goal was later complicated by Gödel’s work, Hilbert’s problems and formal approach helped structure 20th-century research and clarified what it means to found mathematics on clear principles.",
          },
          D: {
            jBio:
              "Hardy specialized in analytic number theory and helped introduce rigorous methods into the study of primes and series. He famously defended pure mathematics “for its own sake” and mentored Ramanujan, playing a crucial role in developing and publicizing some of Ramanujan’s extraordinary discoveries.",
            qBio:
              "Noether transformed algebra with her work on rings, ideals, and invariants, and her famous theorem linked symmetries in physics to conservation laws. Her abstract, structural viewpoint reshaped the way mathematicians think about algebraic systems, making her one of the most influential mathematicians of the 20th century.",
            kBio:
              "Largely self-taught, Ramanujan produced astonishing formulas in number theory, including identities for partitions, modular forms, and infinite series. His notebooks revealed a seemingly intuitive grasp of deep numerical patterns, inspiring generations of mathematicians and leaving a legacy still being explored today.",
          },
          H: {
            jBio:
              "Kolmogorov gave probability theory a rigorous axiomatic foundation and studied stochastic processes, turbulence, and information. His work linked random phenomena with measure theory, providing tools to analyze noise, diffusion, and uncertainty in physical systems, and shaping how modern mathematics treats chance and change.",
            qBio:
              "As a NASA mathematician, Johnson calculated trajectories, launch windows, and re-entry paths for crewed space missions, including the first American orbital flights. Her precise work in applied mathematics and celestial mechanics made space travel safer and more predictable, and her story highlights both talent and perseverance.",
            kBio:
              "Von Neumann’s work spanned functional analysis, quantum mechanics, game theory, and numerical methods. He helped formalize quantum theory mathematically, pioneered ideas in computing, and analyzed strategic behavior in economics, exemplifying how sophisticated mathematics can model complex, evolving systems in the real world.",
          },
        },
      }),
    },
  ],
};

const WESTERN_PHILOSOPHY_ID = "westernPhilosophy" as const;

const westernPhilosophyPair: DeckPairDefinition = {
  id: WESTERN_PHILOSOPHY_ID,
  name: "Western Philosophy",
  pairCode: "WPH",
  deckPairTheme: "Western Philosophy",
  deckPairBlurb:
    "Two decks tracing questions of knowledge, value, reality, and the good life — from ancient schools through modern critical inquiry in European and wider Western lineages.",
  defaultUnlocked: true,
  suitThemes: [
    {
      suit: "S",
      name: "Political & Social Philosophy",
      description:
        "The suit of power and society — legitimacy, rights, duties, laws, institutions, and how oppression and resistance shape collective life.",
    },
    {
      suit: "C",
      name: "Metaphysics & Ontology",
      description:
        "The suit of hidden foundations — what exists, what it means to be, and how minds, bodies, numbers, causes, and possibilities structure reality at the deepest level.",
    },
    {
      suit: "D",
      name: "Epistemology & Philosophy of Science",
      description:
        "The suit of knowledge — justification, evidence, good reasoning, scientific method, reliable theories, and the limits of inquiry.",
    },
    {
      suit: "H",
      name: "Ethics & Moral Philosophy",
      description:
        "The suit of moral life — right and wrong, the good life, virtue, responsibility, and the choices that define how we should live and treat one another.",
    },
  ],
  decks: [
    {
      label: "Classical",
      cardBackPath: sharedDeckCardBackPath(1),
      jokers: themedJokers({
        pairId: "westernPhilosophy",
        deck: 1,
        jokers: [
          {
            bio: "A leading Sophist of classical Greece, Protagoras famously claimed that “man is the measure of all things.” He raised enduring questions about whether truth and value are relative to human perspectives and how rhetoric, persuasion, and power shape what people accept as real or just.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Often seen as the founder of ancient skepticism, Pyrrho urged withholding judgment about how things truly are. By suspending belief rather than insisting on certainty, he sought peace of mind and highlighted the difficulty of ever fully grasping reality through dogmatic theories.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "A provocative Cynic, Diogenes rejected social conventions and lived with extreme simplicity, often shocking Athenians with his behavior. By mocking prestige, wealth, and politeness, he forced people to confront what truly matters, turning his own life into a sharp critique of hypocrisy and false values.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Known as the philosopher of flux, Heraclitus taught that everything flows and that apparent opposites belong together. His cryptic sayings challenge the idea of any fixed, stable reality, suggesting that change and tension are woven into the very structure of the world.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
          },
        ],
      }),
      faces: themedFaces({
        pairId: "westernPhilosophy",
        deck: 1,
        faces: {
          S: {
            jBio:
              "In works like The City of God, Augustine reflected on empire, history, justice, and the tension between earthly power and the heavenly city, shaping Western views of politics and society for centuries.",
            qBio:
              "Aspasia was a prominent figure in classical Athens, known for her wit, rhetorical skill, and association with Pericles. Though little of her own work survives, later writers depict her at the crossroads of philosophy, public speech, and politics, participating in debates about civic life and power.",
            kBio:
              "Aquinas integrated Aristotelian philosophy with Christian theology, developing influential views on law, justice, and the common good. His account of natural law frames moral and political order as grounded in human reason and a larger divine plan, shaping centuries of thought on ethics and society.",
          },
          C: {
            jBio:
              "Founder of Neoplatonism, Plotinus taught that all reality flows from “the One,” a transcendent source from which Intellect and Soul emanate, shaping much later Christian, Jewish, and Islamic metaphysics.",
            qBio:
              "A medieval abbess, mystic, and polymath, Hildegard described a richly ordered cosmos in visionary writings that wove together theology, nature, and music. Her work presents creation as a harmonious whole, revealing a metaphysical vision where divine light and natural order suffuse everything that exists.",
            kBio:
              "Aristotle systematized vast areas of knowledge, but at the core of his work is metaphysics: the study of substance, form, matter, and cause. He asked what it is for something to be, how change is possible, and how the world’s underlying structure makes experience intelligible.",
          },
          D: {
            jBio:
              "A leading ancient skeptic, Sextus Empiricus challenged dogmatic claims to knowledge and argued that suspending judgment can bring a surprising kind of calm.",
            qBio:
              "A celebrated late-ancient mathematician and philosopher, Hypatia taught astronomy, geometry, and Neoplatonism in Alexandria. She became a symbol of the pursuit of knowledge in a turbulent world, representing both the power of scientific and philosophical learning and its vulnerability to political and religious conflict.",
            kBio:
              "Plato distinguished opinion from knowledge, arguing that true understanding concerns unchanging Forms rather than the shifting world of appearances. Through myths like the cave and the divided line, he explored how the soul can ascend from illusion to insight and what it means genuinely to know.",
          },
          H: {
            jBio:
              "Epicurus taught that the good life is one of modest pleasures, friendship, and freedom from fear, urging us to dispel superstition and accept mortality to find lasting tranquility.",
            qBio:
              "In Plato’s Symposium, Diotima appears as Socrates’ teacher in the art of love. She describes an ascent from physical attraction to the love of souls, laws, knowledge, and finally Beauty itself, presenting love as a guiding force toward wisdom and a better, more reflective life.",
            kBio:
              "Known through Plato’s dialogues, Socrates wandered Athens asking probing questions about virtue, justice, and the good life. He claimed to know only his own ignorance, yet insisted that the unexamined life is not worth living, choosing death rather than abandon his commitment to truth and integrity.",
          },
        },
      }),
    },
    {
      label: "Modern",
      cardBackPath: sharedDeckCardBackPath(2),
      jokers: themedJokers({
        pairId: "westernPhilosophy",
        deck: 2,
        jokers: [
          {
            bio: "Novelist and philosopher of the absurd, Camus argued that we live in a universe without pre-given meaning. Rather than despair or resignation, he urged lucid awareness, revolt, and solidarity, asking how we can live with dignity and honesty amid suffering and uncertainty.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "An existentialist philosopher and writer, Sartre claimed that “existence precedes essence”: we are thrown into the world without fixed natures and must create ourselves through our choices. He analyzed bad faith, freedom, and responsibility, insisting that we cannot escape owning the lives we make.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "A fierce critic of traditional morality, religion, and the idea of objective truth, Nietzsche called for a “revaluation of all values.” He challenged inherited notions of good and evil, explored the will to power, and asked what it would mean to affirm life without comforting illusions.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
          },
          {
            bio: "Wittgenstein radically rethought language and meaning, first treating propositions as pictures of reality, then emphasizing everyday “language games.” He asked how the rules we follow in practice give our words sense, challenging philosophers to see confusion in language as the source of many traditional problems.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
          },
        ],
      }),
      faces: themedFaces({
        pairId: "westernPhilosophy",
        deck: 2,
        faces: {
          S: {
            jBio:
              "Mill defended individual liberty and the “harm principle,” arguing that society and the state should only limit freedom to prevent harm to others, while also supporting democracy, women’s rights, and free discussion.",
            qBio:
              "Arendt examined totalitarianism, revolution, and the nature of public life. She asked what it means to act together, to judge politically, and to build spaces where people can appear, speak, and be seen. Her work probes both the dangers and possibilities of modern mass societies.",
            kBio:
              "Marx analyzed capitalism as a system structured by class domination, exploitation, and alienation. He argued that economic relations shape law, politics, and culture, and that historical change is driven by class struggle, inspiring powerful movements and critiques of modern industrial society.",
          },
          C: {
            jBio:
              "Spinoza proposed that there is only one substance—God or Nature—and that everything else is a mode of this single reality, offering a rigorously rational and radically unified picture of existence.",
            qBio:
              "A bold 17th-century writer and philosopher, Cavendish criticized the new mechanical science and proposed her own view of a self-moving, vital material world. Refusing to separate matter and motion, she imagined a universe alive with activity, challenging dominant accounts of nature and knowledge.",
            kBio:
              "Descartes sought indubitable foundations for knowledge, beginning from the famous “I think, therefore I am.” He argued that mind and body are distinct substances and that clear and distinct ideas, guaranteed by God, reveal the basic structure of reality, inaugurating a new modern metaphysics.",
          },
          D: {
            jBio:
              "Popper argued that scientific theories can never be conclusively verified, only rigorously tested and potentially falsified, making bold conjecture and critical refutation the engine of scientific progress.",
            qBio:
              "An accomplished mathematician, physicist, and philosopher, du Châtelet translated and expanded Newton’s work, clarifying the concepts of energy and motion. She defended the importance of experiment, mathematical reasoning, and clear explanation in science, helping to shape Enlightenment views of how we understand nature.",
            kBio:
              "Hume grounded knowledge in experience and habit, arguing that we never directly perceive necessary connections between events. His skeptical analysis of causation, induction, and the self questioned how much we can really justify, while still leaving room for everyday belief and scientific practice.",
          },
          H: {
            jBio:
              "Foot helped revive virtue ethics in the 20th century, emphasizing character and practical reasoning over abstract rules. She introduced famous thought experiments like the trolley problem, challenging how we think about intention, consequences, and moral responsibility in hard cases.",
            qBio:
              "An existentialist thinker and pioneering feminist, Beauvoir explored how women are made “the Other” in a male-dominated world. She examined freedom, responsibility, and oppression, arguing that liberation requires both personal choice and social transformation, and that no one is born a woman but becomes one.",
            kBio:
              "Kant argued that morality is grounded in reason and the dignity of persons. His “categorical imperative” demands that we act only on principles we could will as universal laws and that we treat every person as an end in themselves, reshaping modern debates about duty and freedom.",
          },
        },
      }),
    },
  ],
};

/** Product registry: stable menu order — Base, Computer Science, Western Philosophy, Mathematics. */
export const deckPairs: readonly DeckPairDefinition[] = [
  basePair,
  computerSciencePair,
  westernPhilosophyPair,
  mathematicsPair,
];

export function getDeckPairById(id: string): DeckPairDefinition | undefined {
  return deckPairs.find((p) => p.id === id);
}

/** Flattened joker catalog for a pair (deck 1 slots 1–4, then deck 2). Matches in-game `JokerCard.id` indexing. */
export function allJokersInDeckPair(pairId: string): readonly DeckJokerCard[] {
  const p = getDeckPairById(pairId);
  if (!p) return [];
  return [...p.decks[0].jokers, ...p.decks[1].jokers];
}

/** Catalog row for an in-play joker id (`id % jokerList.length`). */
export function jokerDefinitionForInGameId(
  pairId: string,
  jokerId: number,
): DeckJokerCard | undefined {
  const list = allJokersInDeckPair(pairId);
  if (list.length === 0) return undefined;
  return list[jokerId % list.length];
}

/** Whether the pair can be selected in New Game and opened in Deck Pair Details (Stage 6 may tighten this). */
export function isDeckPairUnlocked(pair: DeckPairDefinition): boolean {
  return pair.defaultUnlocked;
}

export function isDeckPairUnlockedById(id: string): boolean {
  const p = getDeckPairById(id);
  return p ? isDeckPairUnlocked(p) : false;
}

/** Max jokers that can appear in play for this pair (sum of both decks’ joker lists). */
export function maxJokersInPlayForDeckPair(pairId: string): number {
  const p = getDeckPairById(pairId);
  if (!p) return 0;
  return p.decks[0].jokers.length + p.decks[1].jokers.length;
}
