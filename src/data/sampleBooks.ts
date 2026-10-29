import { Book } from '../types';

export const SAMPLE_BOOKS: Book[] = [
  {
    id: 'book-great-gatsby',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    coverGradient: 'from-amber-700 via-amber-900 to-stone-900',
    totalWords: 4800,
    createdAt: new Date().toISOString(),
    analysis: {
      summary:
        'Set in the Jazz Age on Long Island, The Great Gatsby depicts narrator Nick Carraway\'s interactions with mysterious millionaire Jay Gatsby and Gatsby\'s obsession to reunite with his former lover, Daisy Buchanan. Fitzgerald examines themes of idealism, social upheaval, decadence, and the disillusionment of the American Dream in 1920s America.',
      themes: [
        'The Decay of the American Dream',
        'Social Class and Old vs. New Money',
        'The Illusion of Time and the Past',
        'The Green Light and Unattainable Desires',
        'Morality and the Valley of Ashes',
      ],
      characters: [
        {
          name: 'Jay Gatsby',
          role: 'Enigmatic Protagonist',
          description:
            'A fabulously wealthy young man living in a Gothic mansion in West Egg. He stages lavish parties every Saturday night, but no one knows where he comes from or how he made his fortune.',
        },
        {
          name: 'Nick Carraway',
          role: 'Narrator and Moral Observer',
          description:
            'A young man from Minnesota who moves to New York to learn the bond business. Honest, tolerant, and reserved, Nick serves as a confidant for those around him.',
        },
        {
          name: 'Daisy Buchanan',
          role: 'The Object of Gatsby\'s Obsession',
          description:
            'Nick\'s cousin and the woman Gatsby loves. Harboring a deep need to be loved, she lives in East Egg across the bay with her wealthy husband, Tom.',
        },
        {
          name: 'Tom Buchanan',
          role: 'Daisy\'s Arrogant Husband',
          description:
            'An immensely wealthy, hypocritical bully whose social attitudes are laced with racism and sexism. He is physically powerful and unapologetic.',
        },
      ],
      keyQuotes: [
        {
          quote: 'So we beat on, boats against the current, borne back ceaselessly into the past.',
          context: 'Closing lines of the novel spoken by Nick Carraway.',
          significance: 'Reflects humanity\'s perpetual struggle to achieve the future while trapped by the gravity of the past.',
        },
        {
          quote: 'Gatsby believed in the green light, the orgastic future that year by year recedes before us.',
          context: 'Nick observing Gatsby looking across the sound at Daisy\'s dock.',
          significance: 'The green light represents Gatsby\'s hopes, dreams, and the illusory promise of romantic fulfillment.',
        },
      ],
      suggestedAudiences: ['High School (AP Literature)', 'College / University', 'Book Clubs', 'General Readers'],
    },
    chapters: [
      {
        id: 'gatsby-ch1',
        title: 'Chapter 1: West Egg and East Egg',
        order: 1,
        wordCount: 1620,
        content: `In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.

"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven't had the advantages that you've had."

He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I'm inclined to reserve all judgements, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.

When I came back from the East last autumn I felt that I wanted the world to be in uniform and at a sort of moral attention forever; I wanted no more riotous excursions with privileged glimpses into the human heart. Only Gatsby, the man who gives his name to this book, was exempt from my reaction—Gatsby, who represented everything for which I have an unaffected scorn. If personality is an unbroken series of successful gestures, then there was something gorgeous about him, some heightened sensitivity to the promises of life... It was an extraordinary gift for hope, a romantic readiness such as I have never found in any other person and which it is not likely I shall ever find again.

My house was at the very tip of the egg, only fifty yards from the Sound, and squeezed between two huge places that rented for twelve or fifteen thousand a season. The one on my right was a colossal affair by any standard—it was a factual imitation of some Hotel de Ville in Normandy, with a tower on one side, spanking new under a thin beard of raw ivy, and a marble swimming pool, and more than forty acres of lawn and garden. It was Gatsby's mansion.

Across the courtesy bay the white palaces of fashionable East Egg glittered along the water. I drove over there to have dinner with the Tom Buchanans. Daisy was my second cousin once removed, and I'd known Tom in college.

Inside the salon, the only completely stationary object was an enormous couch on which two young women were buoyed up as though upon an anchored balloon. They were both in white, and their dresses were rippling and fluttering as if they had just been blown back in after a short flight around the house.

"I'm p-paralyzed with happiness," she laughed, and held on to my hand. Daisy's voice was a promise that she had done gay, exciting things just a while since and that there were gay, exciting things hovering in the next hour.

Later, when I returned home to West Egg in the moonlight, I saw a figure emerge from the shadow of Gatsby's mansion. He stretched out his arms toward the dark water in a curious way, and, far as I was from him, I could have sworn he was trembling. Involuntarily I glanced seaward—and distinguished nothing except a single green light, minute and far away, that might have been the end of a dock.`,
      },
      {
        id: 'gatsby-ch2',
        title: 'Chapter 2: The Valley of Ashes and Dr. Eckleburg',
        order: 2,
        wordCount: 1540,
        content: `About half way between West Egg and New York the motor road hastily joins the railroad and runs beside it for a quarter of a mile, so as to shrink away from a certain desolate area of land. This is a valley of ashes—a fantastic farm where ashes grow like wheat into ridges and hills and grotesque gardens; where ashes take the forms of houses and chimneys and rising smoke and, finally, of men who move dimly and already crumbling through the powdery air.

Above the gray land and the spasms of bleak dust which drift endlessly over it, you perceive, after a moment, the eyes of Doctor T. J. Eckleburg. The eyes of Doctor T. J. Eckleburg are blue and gigantic—their retinas are one yard high. They look out of no face, but, instead, from a pair of enormous yellow spectacles which pass over a non-existent nose. Evidently some wild wag of an oculist set them there to fatten his practice in the borough of Queens, and then sank down himself into eternal blindness, or forgot them and moved away. But his eyes, dimmed a little by many paintless days, under sun and rain, brood on over the solemn dumping ground.

The valley of ashes is bounded on one side by a small foul river, and, when the drawbridge is up to let barges through, the passengers on waiting trains can stare at the dismal scene for as long as half an hour. There is always a halt there of at least a minute, and it was because of this that I first met Tom Buchanan's mistress.

Tom had taken me by the elbow and literally forced me from the car. "We're getting off," he insisted. "I want you to meet my girl."

The interior of the garage was unprosperous and bare; the only car visible was the dust-covered wreck of a Ford. Behind the counter sat George B. Wilson, wiping his hands on a piece of waste. He was a blond, spiritless man, anaemic, and faintly handsome. When he saw us a damp gleam of hope sprang into his light blue eyes.

Then his wife, Myrtle Wilson, appeared in the doorway. She was in the middle thirties, and faintly stout, but she carried her flesh sensuously as some women can. Her face contained no facet or gleam of beauty, but there was an immediately perceptible vitality about her as if the nerves of her body were continually smouldering.

Tom and Myrtle arranged to meet in New York, where they kept an apartment on 158th Street, setting in motion an afternoon of reckless drunkenness and casual cruelty that ended when Tom broke Myrtle's nose with a short deft movement of his open hand for speaking Daisy's name.`,
      },
      {
        id: 'gatsby-ch3',
        title: 'Chapter 3: Gatsby\'s Lavish Saturday Nights',
        order: 3,
        wordCount: 1640,
        content: `There was music from my neighbor's house through the summer nights. In his blue gardens men and girls came and went like moths among the whisperings and the champagne and the stars. At high tide in the afternoon I watched his guests diving from the tower of his raft, or taking the sun on the hot sand of his beach while his two motor-boats slit the waters of the Sound.

On week-ends his Rolls-Royce became an omnibus, bearing parties to and from the city between nine in the morning and long past midnight. And on Mondays eight servants, including an extra gardener, toiled all day with mops and scrubbing-brushes and hammers and shears, repairing the ravages of the night before.

Every Friday five crates of oranges and lemons arrived from a fruiterer in New York—every Monday these same oranges and lemons left his back door in a pyramid of pulpless halves.

I believe that on the first night I went to Gatsby's house I was one of the few guests who had actually been invited. People were not invited—they went there. They got into automobiles which bore them out to Long Island, and somehow they ended up at Gatsby's door. Once there they were introduced by somebody who knew Gatsby, and after that they conducted themselves according to the rules of behaviour associated with an amusement park.

"I've been drunk for about a week now," a stout man with owl-eyed spectacles told me in the great Gothic library. "Look! They're real books! Absolutely real—have pages and everything. I thought they'd be a nice durable cardboard. Matter of fact, they're absolutely real. What thoroughness! What a triumph of craftsmanship! Did you know he didn't even cut the pages?"

Outside in the garden, I found myself sitting at a table with an affable man of about thirty-one or two.

"Your face is familiar," he said, politely. "Weren't you in the First Division during the war?"
"Why, yes. I was in the Twenty-eighth Infantry."
"I was in the Sixteenth until June nineteen-eighteen. I knew I'd seen you somewhere."

We talked for a moment about France. Then:
"This is an unusual party for me. I haven't even seen the host. I live over there—" I waved my hand at the invisible hedge in the distance, "—and this man Gatsby sent over his chauffeur with an invitation."

For a moment he looked at me as if he failed to understand.
"I'm Gatsby," he said suddenly.
"What!" I exclaimed. "Oh, I beg your pardon."
"I thought you knew, old sport. I'm afraid I'm not a very good host."

He smiled understandingly—much more than understandingly. It was one of those rare smiles with a quality of eternal reassurance in it, that you may come across four or five times in life. It faced—or seemed to face—the whole eternal world for an instant, and then concentrated on you with an irresistible prejudice in your favor.`,
      },
    ],
  },
  {
    id: 'book-frankenstein',
    title: 'Frankenstein; or, The Modern Prometheus',
    author: 'Mary Shelley',
    coverGradient: 'from-emerald-800 via-teal-950 to-stone-900',
    totalWords: 4200,
    createdAt: new Date().toISOString(),
    analysis: {
      summary:
        'Frankenstein tells the story of Victor Frankenstein, a young Swiss scientist whose pursuit of esoteric knowledge leads him to animate lifeless matter. Horrified by the hideous creature he creates, Victor abandons him, sparking a tragic sequence of abandonment, vengeance, and existential torment.',
      themes: [
        'The Perils of Unchecked Scientific Ambition',
        'Monstrosity vs. Humanity',
        'Parental Neglect and Moral Duty',
        'Nature as Sublime Refuge and Destroyer',
        'Isolation, Alienation, and Revenge',
      ],
      characters: [
        {
          name: 'Victor Frankenstein',
          role: 'Obsessive Creator',
          description:
            'A brilliant scientist whose fascination with natural philosophy and alchemy culminates in breathing life into dead flesh, only to collapse in dread and regret.',
        },
        {
          name: 'The Creature',
          role: 'The Abandoned Creation',
          description:
            'An eight-foot-tall being endowed with immense strength and sensitivity. Desperately longing for companionship and empathy, society\'s savage revulsion turns his benevolence into wrath.',
        },
        {
          name: 'Captain Robert Walton',
          role: 'The Arctic Explorer / Frame Narrator',
          description:
            'An ambitious British explorer seeking a northern passage to the Pacific, whose obsessive drive parallels Victor Frankenstein\'s perilous ambition.',
        },
      ],
      keyQuotes: [
        {
          quote: 'Beware; for I am fearless, and therefore powerful.',
          context: 'The Creature confronting Victor after Victor breaks his promise to create a companion.',
          significance: 'Captures the inversion of power between creator and created when all hope and restraint are stripped away.',
        },
        {
          quote: 'Learn from me, if not by my precepts, at least by my example, how dangerous is the acquirement of knowledge.',
          context: 'Victor warning Walton as he narrates his ruin.',
          significance: 'The core cautionary theme of Romantic science and intellectual hubris.',
        },
      ],
      suggestedAudiences: ['High School Literature', 'College Humanities', 'Ethics & Science Seminars', 'Book Clubs'],
    },
    chapters: [
      {
        id: 'frank-ch1',
        title: 'Chapter 4: The Spark of Being',
        order: 1,
        wordCount: 1400,
        content: `From the midst of this darkness a sudden light broke in upon me—a light so brilliant and wondrous, yet so simple, that while I became dizzy with the immensity of the prospect which it illustrated, I was surprised that among so many men of genius who had directed their inquiries towards the same science, that I alone should be reserved to discover so astonishing a secret.

Remember, I am not recording the vision of a madman. The sun does not more certainly shine in the heavens than that which I now affirm is true. Some miracle might have produced it, yet the stages of the discovery were distinct and probable. After days and nights of incredible labour and fatigue, I succeeded in discovering the cause of generation and life; nay, more, I became myself capable of bestowing animation upon lifeless matter.

The astonishment which I had at first experienced on this discovery soon gave place to delight and rapture. After so much time spent in painful labour, to arrive at once at the summit of my desires was the most gratifying consummation of my toils. But this discovery was so great and overwhelming that all the steps by which I had been progressively led towards it were obliterated, and I beheld only the result. What had been the study and desire of the wisest men since the creation of the world was now within my grasp.

No one can conceive the variety of feelings which bore me onwards, like a whirlwind, eager to penetrate into the secrets of nature. A new species would bless me as its creator and source; many happy and excellent natures would owe their being to me. No father could claim the gratitude of his child so completely as I should deserve theirs.

Pursuing these reflections, I thought that if I could bestow animation upon lifeless matter, I might in process of time renew life where death had apparently devoted the body to corruption. These thoughts supported my spirits, while I pursued my undertaking with unremitting ardour. My cheek had grown pale with study, and my person had become emaciated with confinement.`,
      },
      {
        id: 'frank-ch2',
        title: 'Chapter 5: The Awful Awakening',
        order: 2,
        wordCount: 1380,
        content: `It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.

How can I describe my emotions at this catastrophe, or how delineate the wretch whom with such infinite pains and care I had endeavoured to form? His limbs were in proportion, and I had selected his features as beautiful. Beautiful! Great God! His yellow skin scarcely covered the work of muscles and arteries beneath; his hair was of a lustrous black, and flowing; his teeth of a pearly whiteness; but these luxuriances only formed a more horrid contrast with his watery eyes, that seemed almost of the same colour as the dun-white sockets in which they were set, his shrivelled complexion and straight black lips.

The different accidents of life are not so changeable as the feelings of human nature. I had worked hard for nearly two years, for the sole purpose of infusing life into an inanimate body. For this I had deprived myself of rest and health. I had desired it with an ardour that far exceeded moderation; but now that I had finished, the beauty of the dream vanished, and breathless horror and disgust filled my heart.

Unable to endure the aspect of the being I had created, I rushed out of the room and continued a long time traversing my bed-chamber, unable to compose my mind to sleep. At length lassitude succeeded to the tumult I had before endured, and I threw myself on the bed in my clothes, endeavouring to seek a few moments of forgetfulness. But it was in vain; I slept, indeed, but I was disturbed by the wildest dreams.

I started from my sleep with horror; a cold dew covered my forehead, my teeth chattered, and every limb became convulsed; when, by the dim and yellow light of the moon, as it forced its way through the window shutters, I beheld the wretch—the miserable monster whom I had created. He held up the curtain of the bed; and his eyes, if eyes they may be called, were fixed on me. His jaws opened, and he muttered some inarticulate sounds, while a grin wrinkled his cheeks. He might have spoken, but I did not hear; one hand was stretched out, seemingly to detain me, but I escaped and rushed downstairs.`,
      },
      {
        id: 'frank-ch3',
        title: 'Chapter 10: The Confrontation on the Mer de Glace',
        order: 3,
        wordCount: 1420,
        content: `It was nearly noon when I arrived at the top of the ascent. For some time I sat upon the rock that overlooks the sea of ice. A mist covered both that and the surrounding mountains. Presently a breeze dissipated the cloud, and I descended upon the glacier. The surface is very uneven, rising like the waves of a troubled sea, descending low, and intersected by ravines of ice.

As I said this I suddenly beheld the figure of a man, at some distance, advancing towards me with superhuman speed. He bounded over the crevices in the ice, among which I had walked with caution; his stature, also, as he approached, seemed to exceed that of man. I was troubled; a mist came over my eyes, and I felt a faintness seize me, but I was quickly restored by the cold gale of the mountains. I perceived, as the shape came nearer (sight tremendous and abhorred!) that it was the wretch whom I had created.

"Devil," I exclaimed, "do you dare approach me? And do not you fear the fierce vengeance of my arm wreaked on your miserable head? Begone, vile insect! Or rather, stay, that I may trample you to dust!"

"I expected this reception," said the daemon. "All men hate the wretched; how, then, must I be hated, who am miserable beyond all living things! Yet you, my creator, detest and spurn me, thy creature, to whom thou art bound by ties only dissoluble by the annihilation of one of us. You purpose to kill me. How dare you sport thus with life? Do your duty towards me, and I will do mine towards you and the rest of mankind. If you will comply with my conditions, I will leave them and you at peace; but if you refuse, I will glut the maw of death, until it be satiated with the blood of your remaining friends."

"Abhorred monster! The tortures of hell are too mild a vengeance for thy crimes. Wretched devil! You reproach me with your creation; come on, then, that I may extinguish the spark which I so negligently bestowed."

"Be calm! I entreat you to hear me before you give vent to your hatred on my devoted head. Have I not suffered enough, that you seek to increase my misery? Life, although it may only be an accumulation of anguish, is dear to me, and I will defend it. Remember, thou hast made me more powerful than thyself; my height is superior to thine, my joints more supple. But I will not be tempted to set myself in opposition to thee. I am thy creature, and I will be even mild and docile to my natural lord and king if thou wilt also perform thy part, the which thou owest me. Oh, Frankenstein, be not equitable to every other and trample upon me alone, to whom thy justice, and even thy clemency and affection, is most due. Remember that I am thy creature; I ought to be thy Adam, but I am rather the fallen angel, whom thou drivest from joy for no misdeed. Everywhere I see bliss, from which I alone am irrevocably excluded. I was benevolent and good; misery made me a fiend. Make me happy, and I shall again be virtuous."`,
      },
    ],
  },
  {
    id: 'book-alice',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    coverGradient: 'from-purple-800 via-indigo-900 to-slate-900',
    totalWords: 3800,
    createdAt: new Date().toISOString(),
    analysis: {
      summary:
        "Lewis Carroll's whimsical Victorian classic follows young Alice as she tumbles down a rabbit hole into a surreal underground realm ruled by nonsensical creatures, distorted logic, arbitrary authority, and linguistic wordplay.",
      themes: [
        'The Loss of Childhood Innocence and Identity Shifts',
        'Arbitrary Rules and the Absurdity of Adult Authority',
        'Linguistic Wordplay, Puns, and the Limits of Language',
        'Curiosity, Boredom, and Exploration',
      ],
      characters: [
        {
          name: 'Alice',
          role: 'Curious Protagonist',
          description:
            'A polite, inquisitive seven-year-old girl who attempts to maintain Victorian etiquette and logic in an anarchic dream world.',
        },
        {
          name: 'The White Rabbit',
          role: 'The Catalyst',
          description:
            'A nervous, hurried creature in a waistcoat carrying a pocket watch whose frantic panic lures Alice underground.',
        },
        {
          name: 'The Mad Hatter',
          role: 'Eccentric Host',
          description:
            'A tea-obsessed creature trapped at six o\'clock forever because he quarreled with Time, asking unanswerable riddles.',
        },
        {
          name: 'The Queen of Hearts',
          role: 'Tyrannical Monarch',
          description:
            'A furious playing-card monarch prone to blind rages whose universal solution to every dispute is "Off with their heads!"',
        },
      ],
      keyQuotes: [
        {
          quote: "Curiouser and curiouser! cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English).",
          context: 'Alice growing to nine feet tall after eating the magical cake.',
          significance: 'Iconic expression of wonder and the instability of bodily and linguistic norms.',
        },
        {
          quote: 'Why, sometimes I\'ve believed as many as six impossible things before breakfast.',
          context: 'A celebration of unbounded imagination in Wonderland.',
          significance: 'Highlights the tension between rationalist expectations and imaginative freedom.',
        },
      ],
      suggestedAudiences: ['Middle School', 'High School', 'Linguistics & Philosophy Enthusiasts', 'Book Clubs'],
    },
    chapters: [
      {
        id: 'alice-ch1',
        title: 'Chapter 1: Down the Rabbit-Hole',
        order: 1,
        wordCount: 1250,
        content: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.

In another moment down went Alice after it, never once considering how in the world she was to get out again.

The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.

Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled "ORANGE MARMALADE", but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody underneath, so managed to put it into one of the cupboards as she fell past it.`,
      },
      {
        id: 'alice-ch7',
        title: 'Chapter 7: A Mad Tea-Party',
        order: 2,
        wordCount: 1350,
        content: `There was a table set out under a tree in front of the house, and the March Hare and the Hatter were having tea at it: a Dormouse was sitting between them, fast asleep, and the other two were using it as a cushion, resting their elbows on it, and talking over its head. "Very uncomfortable for the Dormouse," thought Alice; "only, as it's asleep, I suppose it doesn't mind."

The table was a large one, but the three were all crowded together at one corner of it: "No room! No room!" they cried out when they saw Alice coming. "There's plenty of room!" said Alice indignantly, and she sat down in a large arm-chair at one end of the table.

"Have some wine," the March Hare said in an encouraging tone.
Alice looked all round the table, but there was nothing on it but tea. "I don't see any wine," she remarked.
"There isn't any," said the March Hare.
"Then it wasn't very civil of you to offer it," said Alice angrily.
"It wasn't very civil of you to sit down without being invited," said the March Hare.

"I didn't know it was your table," said Alice; "it's laid for a great many more than three."
"Your hair wants cutting," said the Hatter. He had been looking at Alice for some time with great curiosity, and this was his first speech.
"You should learn not to make personal remarks," Alice said with some severity; "it's very rude."

The Hatter opened his eyes very wide on hearing this; but all he said was, "Why is a raven like a writing-desk?"

"Come, we shall have some fun now!" thought Alice. "I'm glad they've begun asking riddles.—I believe I can guess that," she added aloud.
"Do you mean that you think you can find out the answer to it?" said the March Hare.
"Exactly so," said Alice.
"Then you should say what you mean," the March Hare went on.
"I do," Alice hastily replied; "at least—at least I mean what I say—that's the same thing, you know."
"Not the same thing a bit!" said the Hatter. "You might just as well say that 'I see what I eat' is the same thing as 'I eat what I see'!"`,
      },
    ],
  },
];

export const INITIAL_QUESTIONNAIRES = [
  {
    id: 'quest-gatsby-1',
    bookId: 'book-great-gatsby',
    bookTitle: 'The Great Gatsby',
    bookAuthor: 'F. Scott Fitzgerald',
    title: 'The Great Gatsby: Comprehensive Thematic & Reading Assessment',
    description:
      'A multi-tiered questionnaire examining character motivations, symbolic imagery (the green light, eyes of Dr. Eckleburg), class divisions, and narrative voice in Chapters 1-3.',
    targetAudience: 'high_school' as const,
    difficulty: 'medium' as const,
    chapterScope: ['all'],
    questionTypes: ['multiple_choice', 'true_false', 'short_answer', 'quote_identification'] as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-gatsby-1',
        type: 'multiple_choice' as const,
        prompt:
          'What fundamental piece of advice does Nick Carraway’s father give him in the opening lines of the novel?',
        options: [
          'Wealth is temporary, but integrity and family honour endure forever.',
          'Whenever you feel like criticizing anyone, remember not everyone had your advantages.',
          'Always keep your business in the West where people are honest and dependable.',
          'Never trust a man who smiles too quickly or flaunts his possessions.',
        ],
        correctAnswer: '1',
        explanation:
          'Nick begins Chapter 1 recalling his father\'s advice: "Whenever you feel like criticizing any one, just remember that all the people in this world haven\'t had the advantages that you\'ve had."',
        bloomsLevel: 'remember' as const,
        points: 5,
        bookCitation: {
          chapter: 'Chapter 1',
          quoteSnippet: '"Whenever you feel like criticizing any one," he told me...',
        },
      },
      {
        id: 'q-gatsby-2',
        type: 'quote_identification' as const,
        prompt:
          'Who says this line upon Nick’s arrival at the Buchanan residence: "I\'m p-paralyzed with happiness!"?',
        options: ['Jordan Baker', 'Daisy Buchanan', 'Myrtle Wilson', 'Catherine'],
        correctAnswer: '1',
        explanation:
          'Daisy laughs and speaks this line when greeted by Nick, typifying her flirtatious, performative charm and magnetic voice.',
        bloomsLevel: 'understand' as const,
        points: 5,
        bookCitation: {
          chapter: 'Chapter 1',
          quoteSnippet: '"I\'m p-paralyzed with happiness," she laughed, and held on to my hand.',
        },
      },
      {
        id: 'q-gatsby-3',
        type: 'multiple_choice' as const,
        prompt:
          'What symbolic entity overlooks the grim expanse of the Valley of Ashes between West Egg and New York City?',
        options: [
          'A rusted church steeple from an abandoned colonial parish',
          'A massive stone statue of George Washington',
          'The faded gigantic billboard eyes of Doctor T. J. Eckleburg',
          'A billboard advertisement for luxury Packard automobiles',
        ],
        correctAnswer: '2',
        explanation:
          'The billboard of Doctor T. J. Eckleburg, featuring gigantic blue retinas peering through yellow spectacles, broods over the ashheaps, frequently interpreted as the indifferent gaze of God or lost moral vision.',
        bloomsLevel: 'analyze' as const,
        points: 5,
        bookCitation: {
          chapter: 'Chapter 2',
          quoteSnippet: 'The eyes of Doctor T. J. Eckleburg are blue and gigantic—their retinas are one yard high.',
        },
      },
      {
        id: 'q-gatsby-4',
        type: 'true_false' as const,
        prompt:
          'True or False: Jay Gatsby regularly partook in heavy drinking and unruly behavior alongside his guests during his Saturday evening parties.',
        options: ['True', 'False'],
        correctAnswer: '1',
        explanation:
          'False. Nick observes that Gatsby remained sober, aloof, and remarkably disciplined, watching his guests from the marble steps without drinking.',
        bloomsLevel: 'understand' as const,
        points: 5,
        bookCitation: {
          chapter: 'Chapter 3',
          quoteSnippet: '...no one swooned backward on Gatsby, and no French bob touched Gatsby’s shoulder...',
        },
      },
      {
        id: 'q-gatsby-5',
        type: 'short_answer' as const,
        prompt:
          'Explain what the green light at the end of Daisy’s dock represents to Jay Gatsby, and why its symbolic power is so central to the novel.',
        options: [],
        correctAnswer:
          'The green light symbolizes Gatsby\'s yearning for Daisy Buchanan, the romantic idealization of the past, and the broader elusive American Dream of reaching an intoxicating, ever-receding future.',
        explanation:
          'Key elements needed: Mention Daisy Buchanan, the proximity across the bay/dock, Gatsby reaching out into the darkness, and the metaphorical representation of unattainable desire / the American Dream.',
        bloomsLevel: 'analyze' as const,
        points: 10,
        bookCitation: {
          chapter: 'Chapter 1',
          quoteSnippet: '...a single green light, minute and far away, that might have been the end of a dock.',
        },
      },
      {
        id: 'q-gatsby-6',
        type: 'multiple_choice' as const,
        prompt:
          'What astonishes the owl-eyed man in Gatsby\'s Gothic library during the party in Chapter 3?',
        options: [
          'Every book is an ancient handwritten Latin manuscript',
          'The books are real, physical volumes with actual pages, not hollow cardboard props',
          'The bookshelves are entirely empty except for bottles of bourbon',
          'Gatsby has signed his own signature onto every single title',
        ],
        correctAnswer: '1',
        explanation:
          'The owl-eyed man is astounded that Gatsby\'s library contains authentic books with real printed pages rather than fake cardboard spines, proving Gatsby\'s thoroughness in constructing his persona.',
        bloomsLevel: 'understand' as const,
        points: 5,
        bookCitation: {
          chapter: 'Chapter 3',
          quoteSnippet: '"Look! They\'re real books! Absolutely real—have pages and everything."',
        },
      },
    ],
  },
];
