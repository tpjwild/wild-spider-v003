import { deckEntry } from "@/content/deckPairs/deckEntry";
import {
  POWER_2_KINGS_TRANSPARENT,
  POWER_ALL_KINGS_TRANSPARENT,
  POWER_EXTRA_COLUMN,
  POWER_SELECTED_CARD_SKIP1,
  POWER_SELECTED_CARD_SKIP2,
  POWER_SELECTED_CARD_TRANSPARENT,
  POWER_SELECTED_CARD_WILD,
  POWER_SELECTED_COLUMN_TRANSPARENT,
  POWER_CARD_SWAP,
} from "@/content/powerDefinitions";
import { themedSets, themedJokers } from "@/content/deckPairs/builders";
import type { DeckPairDefinition } from "@/content/deckPairs/types";

export const WESTERN_PHILOSOPHY_ID = "westernPhilosophy" as const;

export const westernPhilosophyPair: DeckPairDefinition = {
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
    deckEntry("Classical Deck", "red", {
      jokers: themedJokers({
        pairId: "westernPhilosophy",
        deck: 1,
        jokers: [
          {
            name: "Protagoras",
            bio: "A leading Sophist of classical Greece, Protagoras famously claimed that “man is the measure of all things.” He raised enduring questions about whether truth and value are relative to human perspectives and how rhetoric, persuasion, and power shape what people accept as real or just.",
            powerId: POWER_ALL_KINGS_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "Pyrrho of Elis",
            bio: "Often seen as the founder of ancient skepticism, Pyrrho urged withholding judgment about how things truly are. By suspending belief rather than insisting on certainty, he sought peace of mind and highlighted the difficulty of ever fully grasping reality through dogmatic theories.",
            powerId: POWER_2_KINGS_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "Diogenes of Sinope",
            bio: "A provocative Cynic, Diogenes rejected social conventions and lived with extreme simplicity, often shocking Athenians with his behavior. By mocking prestige, wealth, and politeness, he forced people to confront what truly matters, turning his own life into a sharp critique of hypocrisy and false values.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 30,
            initialDuration: 4,
          },
          {
            name: "Heraclitus",
            bio: "Known as the philosopher of flux, Heraclitus taught that everything flows and that apparent opposites belong together. His cryptic sayings challenge the idea of any fixed, stable reality, suggesting that change and tension are woven into the very structure of the world.",
            powerId: POWER_SELECTED_CARD_WILD,
            initialCharges: 3,
            initialDuration: null,
          },
        ],
      }),
      sets: themedSets({
        pairId: "westernPhilosophy",
        deck: 1,
        sets: {
          S: {
            jName: "Augustine of Hippo",
            jBio:
              "In works like The City of God, Augustine reflected on empire, history, justice, and the tension between earthly power and the heavenly city, shaping Western views of politics and society for centuries.",
            qName: "Aspasia of Miletus",
            qBio:
              "Aspasia was a prominent figure in classical Athens, known for her wit, rhetorical skill, and association with Pericles. Though little of her own work survives, later writers depict her at the crossroads of philosophy, public speech, and politics, participating in debates about civic life and power.",
            kName: "Thomas Aquinas",
            kBio:
              "Aquinas integrated Aristotelian philosophy with Christian theology, developing influential views on law, justice, and the common good. His account of natural law frames moral and political order as grounded in human reason and a larger divine plan, shaping centuries of thought on ethics and society.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
          C: {
            jName: "Plotinus",
            jBio:
              "Founder of Neoplatonism, Plotinus taught that all reality flows from “the One,” a transcendent source from which Intellect and Soul emanate, shaping much later Christian, Jewish, and Islamic metaphysics.",
            qName: "Hildegard of Bingen",
            qBio:
              "A medieval abbess, mystic, and polymath, Hildegard described a richly ordered cosmos in visionary writings that wove together theology, nature, and music. Her work presents creation as a harmonious whole, revealing a metaphysical vision where divine light and natural order suffuse everything that exists.",
            kName: "Aristotle",
            kBio:
              "Aristotle systematized vast areas of knowledge, but at the core of his work is metaphysics: the study of substance, form, matter, and cause. He asked what it is for something to be, how change is possible, and how the world’s underlying structure makes experience intelligible.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
          D: {
            jName: "Sextus Empiricus",
            jBio:
              "A leading ancient skeptic, Sextus Empiricus challenged dogmatic claims to knowledge and argued that suspending judgment can bring a surprising kind of calm.",
            qName: "Hypatia of Alexandria",
            qBio:
              "A celebrated late-ancient mathematician and philosopher, Hypatia taught astronomy, geometry, and Neoplatonism in Alexandria. She became a symbol of the pursuit of knowledge in a turbulent world, representing both the power of scientific and philosophical learning and its vulnerability to political and religious conflict.",
            kName: "Plato",
            kBio:
              "Plato distinguished opinion from knowledge, arguing that true understanding concerns unchanging Forms rather than the shifting world of appearances. Through myths like the cave and the divided line, he explored how the soul can ascend from illusion to insight and what it means genuinely to know.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
          H: {
            jName: "Epicurus",
            jBio:
              "Epicurus taught that the good life is one of modest pleasures, friendship, and freedom from fear, urging us to dispel superstition and accept mortality to find lasting tranquility.",
            qName: "Diotima of Mantinea",
            qBio:
              "In Plato’s Symposium, Diotima appears as Socrates’ teacher in the art of love. She describes an ascent from physical attraction to the love of souls, laws, knowledge, and finally Beauty itself, presenting love as a guiding force toward wisdom and a better, more reflective life.",
            kName: "Socrates",
            kBio:
              "Known through Plato’s dialogues, Socrates wandered Athens asking probing questions about virtue, justice, and the good life. He claimed to know only his own ignorance, yet insisted that the unexamined life is not worth living, choosing death rather than abandon his commitment to truth and integrity.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
        },
      }),
    }),
    deckEntry("Modern Deck", "blue", {
      jokers: themedJokers({
        pairId: "westernPhilosophy",
        deck: 2,
        jokers: [
          {
            name: "Albert Camus",
            bio: "Novelist and philosopher of the absurd, Camus argued that we live in a universe without pre-given meaning. Rather than despair or resignation, he urged lucid awareness, revolt, and solidarity, asking how we can live with dignity and honesty amid suffering and uncertainty.",
            powerId: POWER_CARD_SWAP,
            initialCharges: 10,
            initialDuration: null,
          },
          {
            name: "Jean-Paul Sartre",
            bio: "An existentialist philosopher and writer, Sartre claimed that “existence precedes essence”: we are thrown into the world without fixed natures and must create ourselves through our choices. He analyzed bad faith, freedom, and responsibility, insisting that we cannot escape owning the lives we make.",
            powerId: POWER_EXTRA_COLUMN,
            initialCharges: 10,
            initialDuration: 10,
          },
          {
            name: "Friedrich Nietzsche",
            bio: "A fierce critic of traditional morality, religion, and the idea of objective truth, Nietzsche called for a “revaluation of all values.” He challenged inherited notions of good and evil, explored the will to power, and asked what it would mean to affirm life without comforting illusions.",
            powerId: POWER_SELECTED_CARD_SKIP2,
            initialCharges: 3,
            initialDuration: null,
          },
          {
            name: "Ludwig Wittgenstein",
            bio: "Wittgenstein radically rethought language and meaning, first treating propositions as pictures of reality, then emphasizing everyday “language games.” He asked how the rules we follow in practice give our words sense, challenging philosophers to see confusion in language as the source of many traditional problems.",
            powerId: POWER_SELECTED_COLUMN_TRANSPARENT,
            initialCharges: 3,
            initialDuration: null,
          },
        ],
      }),
      sets: themedSets({
        pairId: "westernPhilosophy",
        deck: 2,
        sets: {
          S: {
            jName: "John Stuart Mill",
            jBio:
              "Mill defended individual liberty and the “harm principle,” arguing that society and the state should only limit freedom to prevent harm to others, while also supporting democracy, women’s rights, and free discussion.",
            qName: "Hannah Arendt",
            qBio:
              "Arendt examined totalitarianism, revolution, and the nature of public life. She asked what it means to act together, to judge politically, and to build spaces where people can appear, speak, and be seen. Her work probes both the dangers and possibilities of modern mass societies.",
            kName: "Karl Marx",
            kBio:
              "Marx analyzed capitalism as a system structured by class domination, exploitation, and alienation. He argued that economic relations shape law, politics, and culture, and that historical change is driven by class struggle, inspiring powerful movements and critiques of modern industrial society.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
          C: {
            jName: "Baruch Spinoza",
            jBio:
              "Spinoza proposed that there is only one substance—God or Nature—and that everything else is a mode of this single reality, offering a rigorously rational and radically unified picture of existence.",
            qName: "Margaret Cavendish",
            qBio:
              "A bold 17th-century writer and philosopher, Cavendish criticized the new mechanical science and proposed her own view of a self-moving, vital material world. Refusing to separate matter and motion, she imagined a universe alive with activity, challenging dominant accounts of nature and knowledge.",
            kName: "René Descartes",
            kBio:
              "Descartes sought indubitable foundations for knowledge, beginning from the famous “I think, therefore I am.” He argued that mind and body are distinct substances and that clear and distinct ideas, guaranteed by God, reveal the basic structure of reality, inaugurating a new modern metaphysics.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
          D: {
            jName: "Karl Popper",
            jBio:
              "Popper argued that scientific theories can never be conclusively verified, only rigorously tested and potentially falsified, making bold conjecture and critical refutation the engine of scientific progress.",
            qName: "Émilie du Châtelet",
            qBio:
              "An accomplished mathematician, physicist, and philosopher, du Châtelet translated and expanded Newton’s work, clarifying the concepts of energy and motion. She defended the importance of experiment, mathematical reasoning, and clear explanation in science, helping to shape Enlightenment views of how we understand nature.",
            kName: "David Hume",
            kBio:
              "Hume grounded knowledge in experience and habit, arguing that we never directly perceive necessary connections between events. His skeptical analysis of causation, induction, and the self questioned how much we can really justify, while still leaving room for everyday belief and scientific practice.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
          H: {
            jName: "Philippa Foot",
            jBio:
              "Foot helped revive virtue ethics in the 20th century, emphasizing character and practical reasoning over abstract rules. She introduced famous thought experiments like the trolley problem, challenging how we think about intention, consequences, and moral responsibility in hard cases.",
            qName: "Simone de Beauvoir",
            qBio:
              "An existentialist thinker and pioneering feminist, Beauvoir explored how women are made “the Other” in a male-dominated world. She examined freedom, responsibility, and oppression, arguing that liberation requires both personal choice and social transformation, and that no one is born a woman but becomes one.",
            kName: "Immanuel Kant",
            kBio:
              "Kant argued that morality is grounded in reason and the dignity of persons. His “categorical imperative” demands that we act only on principles we could will as universal laws and that we treat every person as an end in themselves, reshaping modern debates about duty and freedom.",
            powerId: POWER_SELECTED_CARD_TRANSPARENT,
            initialCharges: 10,
            initialDuration: 5,
          },
        },
      }),
    }),
  ],
};
