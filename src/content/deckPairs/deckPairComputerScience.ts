import { deckEntry } from "@/content/deckPairs/deckEntry";
import {
  POWER_ALL_KINGS_TRANSPARENT,
  POWER_CARD_SWAP,
  POWER_FOUNDATION_RETURN,
  POWER_SELECTED_CARD_TRANSPARENT,
} from "@/content/powerDefinitions";
import { themedSets, themedJokers } from "@/content/deckPairs/builders";
import type { DeckPairDefinition } from "@/content/deckPairs/types";

export const COMPUTER_SCIENCE_ID = "computerScience" as const;

export const computerSciencePair: DeckPairDefinition = {
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
    deckEntry("Classical Deck", "red", {
      jokers: themedJokers({
        pairId: "computerScience",
        deck: 1,
        jokers: [
          {
            name: "Konrad Zuse",
            bio: "Working largely alone in Germany, Zuse built some of the first programmable binary computers, including the Z3. His machines and ideas about high-level languages showed that practical, general-purpose computation could be engineered in hardware, parallel to and partly independent of more widely known efforts elsewhere.",
            powerId: POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "John Backus",
            bio: "Backus led the team that created Fortran, one of the first widely used high-level programming languages, and later introduced Backus–Naur Form for describing syntax. His work helped bridge human intentions and machine instructions, making it easier to write complex programs and reason about language structure.",
            powerId: POWER_FOUNDATION_RETURN,
            initialCharges: 5,
            initialDuration: null,
          },
          {
            name: "Charles Babbage",
            bio: "Babbage designed the Difference Engine and Analytical Engine, ambitious mechanical devices meant to automate calculation. Although never fully built in his lifetime, these designs anticipated programmable computing, with separate memory and control, making him a visionary precursor of modern computer architecture.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "Norbert Wiener",
            bio: "Wiener founded cybernetics, studying control and communication in animals and machines. His work connected feedback loops, signal processing, and information flow, influencing the development of automation, robotics, and early thinking about how systems—biological or artificial—adapt and respond to their environments.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
        ],
      }),
      sets: themedSets({
        pairId: "computerScience",
        deck: 1,
        sets: {
          S: {
            jName: "Dennis Ritchie",
            jBio:
              "Ritchie co-created the C programming language and played a key role in developing the Unix operating system. His work established tools and concepts—such as portable code, simple abstractions, and a clear interface between software and hardware—that deeply shaped modern systems programming and operating systems.",
            qName: "Ada Lovelace",
            qBio:
              "Working with Charles Babbage’s designs, Lovelace described how a general-purpose machine could manipulate symbols according to rules, writing what is often considered the first published algorithm. She saw that such engines could go beyond arithmetic to handle patterns and even music, anticipating the idea of programmable computers.",
            kName: "John von Neumann",
            kBio:
              "Von Neumann helped design some of the earliest electronic computers and articulated the stored-program architecture that still underlies most modern machines. His vision of memory, control, and processing laid out a practical blueprint for turning abstract computation into working hardware and software systems.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
          C: {
            jName: "John McCarthy",
            jBio:
              "McCarthy coined the term “artificial intelligence,” designed the Lisp programming language, and developed foundational ideas in symbolic AI and time-sharing. His work framed computing not just as calculation but as a domain where machines might reason, plan, and interact using formal representations of knowledge.",
            qName: "Grace Hopper",
            qBio:
              "Hopper helped create early compilers and popularized the idea of high-level programming languages, making code more readable and accessible. She championed the notion of “bug” and “debugging” in software and played a crucial role in moving from machine code to more human-friendly ways of instructing computers.",
            kName: "Alan Turing",
            kBio:
              "Turing defined a simple idealized machine to capture the essence of computation and showed that some questions, like whether a program halts, are undecidable. His work on computability, algorithms, and codebreaking makes him one of the central founders of both theoretical computer science and modern computing.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
          D: {
            jName: "Whitfield Diffie",
            jBio:
              "Diffie co-developed public-key cryptography, introducing a way for two parties to establish a shared secret over an insecure channel. This breakthrough underlies many modern security protocols, enabling secure communication and authentication on open networks without pre-shared keys.",
            qName: "Hedy Lamarr",
            qBio:
              "Better known as an actress, Lamarr co-invented a frequency-hopping technique originally intended to secure wartime radio guidance. Although not realized immediately, the idea anticipated spread-spectrum methods later used in wireless communication, making her an unexpected but important figure in the story of secure data transmission.",
            kName: "Claude Shannon",
            kBio:
              "Shannon founded information theory, introducing the bit and showing how to quantify information and communication capacity. He proved that reliable communication is possible over noisy channels using coding schemes, laying the mathematical groundwork for digital communication, data compression, and error-correcting codes used everywhere today.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
          H: {
            jName: "Douglas Engelbart",
            jBio:
              "Engelbart envisioned computers as tools for augmenting human intellect. His famous 1968 “Mother of All Demos” introduced the mouse, hypertext, windowed interfaces, and collaborative editing, foreshadowing many aspects of modern interactive computing and networked work decades before they became commonplace.",
            qName: "Adele Goldberg",
            qBio:
              "Working at Xerox PARC, Goldberg contributed to the development of Smalltalk, one of the earliest object-oriented languages, and helped pioneer graphical user interface concepts. Through both research and education, she shaped how people learn about programming and how they interact with computers through windows, icons, and objects.",
            kName: "Edsger W. Dijkstra",
            kBio:
              "Dijkstra advocated for structured programming and mathematical clarity in software, insisting that programs should be reasoned about, not merely hacked together. His essays and algorithms emphasized simplicity, correctness, and elegance, profoundly influencing how generations of programmers think about writing and proving code.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
        },
      }),
    }),
    deckEntry("Modern Deck", "blue", {
      jokers: themedJokers({
        pairId: "computerScience",
        deck: 2,
        jokers: [
          {
            name: "Geoffrey Hinton",
            bio: "Hinton played a central role in developing deep learning, showing how neural networks with many layers could learn complex patterns from data. His work on backpropagation and representation learning helped trigger a modern AI boom, with applications from image recognition to speech and natural language processing.",
            powerId: POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "Guido van Rossum",
            bio: "Van Rossum created the Python programming language, emphasizing readability, simplicity, and a friendly community. Python’s clear syntax and batteries-included standard library have made it a go-to language for education, scripting, web development, data science, and AI, reflecting his vision of approachable, practical code.",
            powerId: POWER_CARD_SWAP,
            initialCharges: 5,
            initialDuration: null,
          },
          {
            name: "Marvin Minsky",
            bio: "Minsky was a leading figure in early artificial intelligence, exploring how machines might represent knowledge and reason symbolically. His ambitious, sometimes controversial ideas pushed the boundaries of what computing and cognition might mean, inspiring both breakthroughs and critiques in the history of AI research.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "Richard Stallman",
            bio: "Stallman founded the Free Software movement, arguing that users should be free to study, modify, and share the software they run. Through the GNU project and the GPL license, he championed strong ethical and legal frameworks for software freedom, influencing open-source culture worldwide.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
        ],
      }),
      sets: themedSets({
        pairId: "computerScience",
        deck: 2,
        sets: {
          S: {
            jName: "Linus Torvalds",
            jBio:
              "Torvalds initiated the Linux kernel and fostered its development as an open-source project. Linux has become a foundation for servers, embedded systems, and many other platforms, demonstrating how collaborative, distributed development can produce robust, widely deployed operating systems.",
            qName: "Barbara Liskov",
            qBio:
              "Liskov pioneered ideas in programming languages and distributed systems, including the Liskov substitution principle and the CLU language. Her work on abstraction, data types, and fault-tolerant replication shaped how large, complex software systems are designed, specified, and kept reliable over time.",
            kName: "Ken Thompson",
            kBio:
              "Thompson co-created the Unix operating system and the B programming language, helping define the structure of modern multi-user, multitasking systems. His work on simple, composable tools and clear abstractions influenced generations of operating systems and command-line environments.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
          C: {
            jName: "Stephen Cook",
            jBio:
              "Cook introduced the notion of NP-completeness, proving that the satisfiability problem is NP-complete and opening a vast field of research on computational complexity. His work crystallized the central P versus NP question, highlighting the deep divide between problems that are easy to check and those easy to solve.",
            qName: "Shafi Goldwasser",
            qBio:
              "Goldwasser made fundamental contributions to cryptography and complexity theory, including work on probabilistic encryption, zero-knowledge proofs, and interactive proofs. Her results showed how randomness and interaction can provide strong security guarantees, reshaping how theorists think about privacy, verification, and computational hardness.",
            kName: "Donald Knuth",
            kBio:
              "Knuth’s multi-volume The Art of Computer Programming systematically analyzes algorithms and data structures, emphasizing both correctness and efficiency. He helped establish algorithm analysis as a rigorous discipline and popularized literate programming, treating code and explanation together as a kind of mathematical literature.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
          D: {
            jName: "John O'Sullivan",
            jBio:
              "O’Sullivan led research at Australia’s CSIRO that developed techniques for detecting faint radio signals, work that later underpinned core Wi-Fi technologies. His contributions helped make fast, reliable wireless networking practical, enabling the everyday experience of connecting devices without cables.",
            qName: "Radia Perlman",
            qBio:
              "Perlman designed the Spanning Tree Protocol and made key contributions to network routing and robustness. Her work helps ensure that data packets can find paths through complex, redundant networks without getting trapped in loops, making large-scale communication infrastructures more stable and resilient.",
            kName: "Vint Cerf",
            kBio:
              "Cerf co-designed the TCP/IP protocols that underpin the internet, enabling diverse networks to interconnect and route data reliably. Often called a “father of the internet,” he helped establish the layered architecture that allows information to move flexibly between machines across the globe.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
          H: {
            jName: "Jimmy Wales",
            jBio:
              "Wales co-founded Wikipedia, an open, collaboratively written encyclopedia that harnesses contributions from volunteers worldwide. The project illustrates how networked communities and simple editing tools can create and maintain a vast, constantly evolving store of shared knowledge on the web.",
            qName: "Margaret Hamilton",
            qBio:
              "Hamilton led the team that developed onboard flight software for NASA’s Apollo missions, coining the term “software engineering” to emphasize disciplined development. Her work on reliability and error handling helped keep astronauts safe, demonstrating how careful coding practices can have life-or-death consequences in real systems.",
            kName: "Tim Berners-Lee",
            kBio:
              "Berners-Lee invented the World Wide Web, designing URLs, HTTP, and HTML to make information easily shareable across the internet. His vision of a decentralized, open hypertext system transformed how people access, publish, and connect information, profoundly reshaping communication, knowledge, and everyday life.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
        },
      }),
    }),
  ],
};
