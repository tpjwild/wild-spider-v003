import { deckEntry } from "@/content/deckPairs/deckEntry";
import {
  JOKER_POWER_ALL_KINGS_TRANSPARENT,
  JOKER_POWER_SELECTED_CARD_TRANSPARENT,
} from "@/content/powerDefinitions";
import { themedFaces, themedJokers } from "@/content/deckPairs/builders";
import type { DeckPairDefinition } from "@/content/deckPairs/types";

export const MATHEMATICS_ID = "mathematics" as const;

export const mathematicsPair: DeckPairDefinition = {
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
    deckEntry("Classical Deck", "red", {
      jokers: themedJokers({
        pairId: "mathematics",
        deck: 1,
        jokers: [
          {
            name: "Évariste Galois",
            bio: "Galois died at twenty after a duel, leaving behind notes that founded group theory and transformed algebra. His insights revealed how the symmetries of polynomial equations determine whether they can be solved by radicals, opening a new realm of abstract structure born from a brief, turbulent life.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "Georg Cantor",
            bio: "Cantor created set theory and showed that some infinities are strictly larger than others, distinguishing, for example, between countable and uncountable sets. His work initially faced strong resistance but ultimately reshaped modern mathematics, providing a language and framework for talking rigorously about infinite collections.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "Zeno of Elea",
            bio: "Zeno is famous for paradoxes that challenge our understanding of motion and infinity, such as Achilles never overtaking the tortoise. By turning simple assumptions into contradictions, he forced later thinkers to refine their notions of space, time, and continuity in more subtle mathematical ways.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "Pythagoras",
            bio: "Half legendary, Pythagoras and his followers saw numbers and ratios as the key to understanding harmony and the cosmos. Their discovery of irrational magnitudes unsettled earlier beliefs about number and proportion, setting the stage for deeper investigations into the foundations and limits of arithmetic.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
        ],
      }),
      faces: themedFaces({
        pairId: "mathematics",
        deck: 1,
        faces: {
          S: {
            jName: "Pierre-Simon Laplace",
            jBio:
              "Laplace developed a powerful mathematical theory of celestial mechanics, explaining planetary motions and perturbations with differential equations and probability. He envisioned a universe governed by deterministic laws, where, in principle, complete knowledge of the present could reveal both past and future states of the cosmos.",
            qName: "Mary Somerville",
            qBio:
              "Largely self-taught, Somerville synthesized advanced work in celestial mechanics and physical science for a broader audience. Her writings helped connect mathematical theories of space, gravitation, and light to the emerging picture of the cosmos, demonstrating how abstract analysis could illuminate the structure of the universe.",
            kName: "Bernhard Riemann",
            kBio:
              "Riemann revolutionized geometry by introducing curved manifolds, providing the framework later used in general relativity. He also made deep contributions to complex analysis and number theory, including the famous Riemann Hypothesis, reshaping how mathematicians think about space, shape, and the infinite.",
          },
          C: {
            jName: "Gottfried Wilhelm Leibniz",
            jBio:
              "Leibniz independently developed calculus and introduced much of the notation still used today. He envisioned a universal symbolic language for reasoning and contributed deeply to logic and metaphysics, aiming to systematize thought itself in a way that anticipated later formal approaches to mathematics.",
            qName: "Sofya Kovalevskaya",
            qBio:
              "A pioneering 19th-century mathematician, Kovalevskaya made significant contributions to analysis and partial differential equations, including work on the rotation of rigid bodies. As one of the first women to hold a full professorship in mathematics, she also symbolizes the struggle for inclusion in academic life.",
            kName: "Euclid",
            kBio:
              "Euclid’s Elements organized Greek geometry into a clear axiomatic system of definitions, postulates, and proofs. For centuries it served as the model of rigorous mathematical reasoning, showing how complex results can be built step by step from simple assumptions about points, lines, and planes.",
          },
          D: {
            jName: "Joseph-Louis Lagrange",
            jBio:
              "Lagrange recast mechanics in a highly mathematical form, using the calculus of variations to describe motion through energy and constraints. His work on equations and series also enriched algebra and analysis, showing how structural and dynamical ideas could reinforce each other in mathematical physics.",
            qName: "Sophie Germain",
            qBio:
              "Working largely in isolation due to barriers against women, Germain advanced number theory, including partial progress on Fermat’s Last Theorem, and made important contributions to the theory of elasticity. Her persistence and insight secured her a lasting place in the history of pure mathematics.",
            kName: "Carl Friedrich Gauss",
            kBio:
              "Often called the “prince of mathematicians,” Gauss made foundational contributions to number theory, algebra, geometry, and analysis. His Disquisitiones Arithmeticae reshaped the study of integers and congruences, revealing deep patterns in primes and modular arithmetic that continue to influence mathematics today.",
          },
          H: {
            jName: "Augustin-Louis Cauchy",
            jBio:
              "Cauchy helped put calculus on a rigorous footing, clarifying concepts like limit, continuity, and convergence. His theorems in analysis and complex variables set standards for precision and proof, turning intuitive ideas about change into a carefully structured, logically secure theory of functions.",
            qName: "Florence Nightingale",
            qBio:
              "Nightingale transformed hospital care and public health by using careful statistics and graphical displays to reveal patterns in mortality and disease. Her famous charts made abstract numbers vivid, demonstrating how quantitative analysis could drive real-world reform and save lives in concrete, measurable ways.",
            kName: "Isaac Newton",
            kBio:
              "Newton co-invented calculus and used it to formulate laws of motion and universal gravitation, linking algebraic equations with physical forces. His work showed how continuous change—accelerating bodies, planetary orbits, falling apples—could be precisely described by differential equations and geometric reasoning.",
          },
        },
      }),
    }),
    deckEntry("Modern Deck", "blue", {
      jokers: themedJokers({
        pairId: "mathematics",
        deck: 2,
        jokers: [
          {
            name: "Paul Erdős",
            bio: "Erdős was an extraordinarily prolific and eccentric mathematician who collaborated with hundreds of others. He helped develop modern combinatorics and the probabilistic method, showing how randomness can prove the existence of intricate structures, and became legendary for his restless travel and love of problem-posing.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "Benoit Mandelbrot",
            bio: "Mandelbrot developed fractal geometry to describe rough, irregular shapes in nature, from coastlines to clouds. The Mandelbrot set, a simple formula generating endlessly complex patterns, became an icon of mathematical beauty and chaos, demonstrating how feedback and iteration create intricate structure from elementary rules.",
            powerId: JOKER_POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "Kurt Gödel",
            bio: "Gödel’s incompleteness theorems showed that any sufficiently strong formal system cannot prove all truths about arithmetic within itself. His work revealed inherent limits to axiomatic methods, transforming our understanding of logic, consistency, and what mathematics can, and cannot, fully capture.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "Stefan Banach",
            bio: "Banach helped create functional analysis, studying infinite-dimensional spaces of functions now called Banach spaces. His work on norms, linear operators, and series provided tools to understand continuity and convergence in very abstract settings, reshaping modern analysis and the geometry of function spaces.",
            powerId: JOKER_POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
        ],
      }),
      faces: themedFaces({
        pairId: "mathematics",
        deck: 2,
        faces: {
          S: {
            jName: "Stephen Smale",
            jBio:
              "Smale’s work in topology and dynamical systems, including the famous “horseshoe” map, illuminated how deterministic systems can exhibit chaotic behavior. He explored the global structure of solutions in high-dimensional spaces, showing how stretching and folding can produce richly complicated patterns from simple rules.",
            qName: "Maryam Mirzakhani",
            qBio:
              "The first woman to win the Fields Medal, Mirzakhani studied hyperbolic geometry, Riemann surfaces, and their moduli spaces. Her work revealed intricate connections between the shapes of surfaces and dynamical behavior, deepening our understanding of complex geometric worlds far beyond everyday intuition.",
            kName: "Henri Poincaré",
            kBio:
              "Poincaré made foundational contributions to topology, dynamical systems, and celestial mechanics. He introduced qualitative methods for studying differential equations and the global shape of spaces, helping to create the modern view of geometry and chaos where the structure of trajectories matters as much as explicit formulas.",
          },
          C: {
            jName: "Alonzo Church",
            jBio:
              "Church developed the lambda calculus and investigated the limits of effective computation, contributing to the Church–Turing thesis. His work in logic and foundations clarified what it means for a function to be computable, influencing both mathematical logic and the later development of computer science.",
            qName: "Mary Cartwright",
            qBio:
              "Cartwright made important contributions to nonlinear differential equations and early chaos theory, studying how small changes can lead to complex behavior in dynamical systems. Her work illuminated the subtle structure of solutions to real-world equations and helped lay groundwork for the modern theory of chaos.",
            kName: "David Hilbert",
            kBio:
              "Hilbert championed the axiomatic method and set an ambitious program to secure mathematics by proving its consistency. Though that goal was later complicated by Gödel’s work, Hilbert’s problems and formal approach helped structure 20th-century research and clarified what it means to found mathematics on clear principles.",
          },
          D: {
            jName: "G. H. Hardy",
            jBio:
              "Hardy specialized in analytic number theory and helped introduce rigorous methods into the study of primes and series. He famously defended pure mathematics “for its own sake” and mentored Ramanujan, playing a crucial role in developing and publicizing some of Ramanujan’s extraordinary discoveries.",
            qName: "Emmy Noether",
            qBio:
              "Noether transformed algebra with her work on rings, ideals, and invariants, and her famous theorem linked symmetries in physics to conservation laws. Her abstract, structural viewpoint reshaped the way mathematicians think about algebraic systems, making her one of the most influential mathematicians of the 20th century.",
            kName: "Srinivasa Ramanujan",
            kBio:
              "Largely self-taught, Ramanujan produced astonishing formulas in number theory, including identities for partitions, modular forms, and infinite series. His notebooks revealed a seemingly intuitive grasp of deep numerical patterns, inspiring generations of mathematicians and leaving a legacy still being explored today.",
          },
          H: {
            jName: "Andrey Kolmogorov",
            jBio:
              "Kolmogorov gave probability theory a rigorous axiomatic foundation and studied stochastic processes, turbulence, and information. His work linked random phenomena with measure theory, providing tools to analyze noise, diffusion, and uncertainty in physical systems, and shaping how modern mathematics treats chance and change.",
            qName: "Katherine Johnson",
            qBio:
              "As a NASA mathematician, Johnson calculated trajectories, launch windows, and re-entry paths for crewed space missions, including the first American orbital flights. Her precise work in applied mathematics and celestial mechanics made space travel safer and more predictable, and her story highlights both talent and perseverance.",
            kName: "John von Neumann",
            kBio:
              "Von Neumann’s work spanned functional analysis, quantum mechanics, game theory, and numerical methods. He helped formalize quantum theory mathematically, pioneered ideas in computing, and analyzed strategic behavior in economics, exemplifying how sophisticated mathematics can model complex, evolving systems in the real world.",
          },
        },
      }),
    }),
  ],
};
