import { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import {FaPlay} from "react-icons/fa"

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  background-color: #fc8c03;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CurrentText = styled.div`
  color: white;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 80px;
  font-weight: bold;
  text-shadow: 0px 0px 11px rgba(0,0,0,0.61);
  width: 900px;
  line-height: 1.4;
  text-align: center;
`;

const PlayButton = styled.div`
  color: white;
  font-size: 88px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const trim = (str) => str.replace(/^\s*/, '').replace(/\s*$/, '');

const LINES_PATTERN = /(?:\s*\r?\n\s*)+/g;

const collapseWhitespace = (text) => trim(text).replace(LINES_PATTERN, '');

const toSentences = (text) => text.split(/\.\s*/).filter(Boolean).map((sentence) => `${sentence}.`);

const LONG_SENTENCE = 30;

const splitLongSentences = (sentences) => sentences.reduce((acc, sentence) => {
  if (sentence.length < LONG_SENTENCE) {
    return [
      ...acc,
      sentence,
    ];
  }

  const splitParts = [];
  let lastSlice = 0;
  let nextSplitMark = 0;
  while (sentence.length - lastSlice > LONG_SENTENCE) {
    nextSplitMark = sentence.indexOf(',', nextSplitMark + 1);
    if (nextSplitMark === -1) {
      break;
    }

    if (nextSplitMark - lastSlice >= LONG_SENTENCE) {
      splitParts.push(trim(sentence.slice(lastSlice, nextSplitMark + 1)));
      lastSlice = nextSplitMark + 1;
    }
  }

  splitParts.push(trim(sentence.slice(lastSlice)));

  return [
    ...acc,
    ...splitParts,
  ];
}, []);

const TEXT_TO_SPEAK = `
Title: Perfect JUST as they are.

From: That's Life Magazine.

It's no secret that dogs are a man's best friend. But, sadly, many shelters across our country are full of pooches that are deemed unlovable due to the rising trend of 'designer dogs'.

Determined to prove that all dogs are worthy of love, Australian photographer, Alex Cearns shares her story below.

Stepping out of the airport, the scent of woody incense lingered in the air.

It was March 2010, and my partner Debra and I had just arrived for our first holiday in Bali. We were so excited to explore.

But on our way to the hotel I couldn’t help but notice how many injured, sick and suffering dogs were on the streets.

Growing up an only child in rural South Australia, my first friend was our old English sheepdog, Ben.

My mum also taught me the importance of caring for sick and injured animals.

Looking after everything from joeys to koalas, she was passionate about helping animals in need.

Now, though, as our taxi zoomed through the streets, I felt surrounded by neglected dogs.

I wish there was a way to help them all, I thought, sadly.

After doing some research over the next few days, I learned about Bali Animal Welfare Association (BAWA), a not-for-profit organisation that worked to save the lives of animals throughout the island.

Having launched an animal photography business two years earlier, I often worked with animal charities, and I wanted to help the volunteers at BAWA in some way too.

So, in 2012, I returned to Bali to photograph different dogs to highlight their plight and raise much-needed funds for their care.

That’s where I met Bali Pip, a 10-week-old puppy suffering from mange.

Living with 60 other dogs at the shelter, she’d never had one-on-one attention with a human.

As I focused my camera on her, she quickly responded with a wagging tail and some loving licks.

Sharing her image on Facebook, it was viewed more than 1.5 million times by people around the world.

Though people were often afraid of animals with a difference, Bali Pip was proof that under her rough exterior there was a gentle soul that just wanted to love and be loved.

Back home, I held an exhibition where I displayed and sold images of dogs and other animals I’d photographed in Bali.

We managed to raise over $15,000 for the shelter.

Better still, after receiving treatment for her mange, Bali Pip was adopted out to a loving home.

From then on, any time I photographed an animal with a disability, I’d tuck it away in a special file.

Whether it was a three-legged dog, a blind cat, or even an echidna who’d lost its spine, they all shared the same tenacity to overcome their adversities.

Some were born with their conditions, others had sadly suffered illness or abuse – like Jakk, a boxer cross, who was found dumped after he was born with deformed front legs.

Thankfully, after being rescued by WA Pet Project, his story hit the news and captured the hearts of people who donated money to help pay his vet bills.

After around the clock care for a few months, he was fitted with a special wheelchair before being adopted. But that never slowed him down though.

He was as energetic as any puppy I’d had the pleasure of photographing.

Another standout was Mya, a Siberian husky, who developed glaucoma.

Sadly, the pain became too much, so one of her eyes was removed.

Eighteen months later, the other was taken too.

It took some getting used to, but Mya’s other senses were exceptional and she soon learned to navigate.

It made me realise no matter what these animals had been through, their zest for life was undeniable.

They deserve to live out long and happy lives like every other creature, I thought.

It’s what inspired me to adopt my own fur family, including Macy the cat, and pooches Pixel and Pip, who was named after the girl that stole my heart in Bali.

Then, in March 2018, I decided to compile a series of photos in a book called Perfect Imperfection, to celebrate the dogs I’d worked with.

Sharing stories of dogs born without eyes, with different diseases, or that were victims of abuse, it was hard to believe some people deemed them unworthy.

Incredibly, the feedback the book received was resoundingly positive.

We recently had to amputate one of our dog’s legs. But after seeing the three-legged dog thriving in your book, we knew it was the right decision, one person wrote.

It felt so good to show others that animals with disabilities were so lovable.

Earlier this year, I was devastated when we lost Pixel. But we’ve since welcomed Marshmallow – a mixed breed puppy born with a cleft palate and spinal issues, who we adopted from No Pup Cleft Behind, a rescue organisation that specialises in rehoming puppies born with cleft palates and lips.

To date, I’ve photographed more than 15,000 animals, but the ones perceived as different will always hold a special place in my heart.

Despite disabilities, they adapt to their bodies without complaint and survive with determination.

They are pawsome just as they are. 
`;

const SEGMENTS = splitLongSentences(toSentences(collapseWhitespace(TEXT_TO_SPEAK)));

const isMidSentence = (segment) => !segment.endsWith('.');

const sleep = (duration) => new Promise((resolve) => {
  setTimeout(resolve, duration);
});

const say = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.65;
  speechSynthesis.speak(utterance);

  return new Promise((resolve) => {
    utterance.onend = resolve;
  });
};

export default function Main() {
  const [currentSegment, setCurrentSegment] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  const nextSegment = () => {
    if (currentSegment + 1 < SEGMENTS.length) {
      setCurrentSegment(currentSegment + 1);
    } else {
      setSpeaking(false);
    }
  }

  useEffect(() => {
    let cancel = false;

    const sayNext = async () => {
      const segment = SEGMENTS[currentSegment];
      await say(segment);
      await sleep(isMidSentence(segment) ? 2000 : 4000);
      if (cancel) {
        return;
      }
      nextSegment();
    };

    if (speaking) {
      sayNext();
    }

    return () => {
      cancel = true;
    };
  }, [currentSegment, speaking]);

  const handleTap = useCallback(() => {
    if (speaking) {
      speechSynthesis.cancel();
      nextSegment();
    }
  }, [speaking])

  return (
    <Wrapper onClick={handleTap}>
      {speaking && (
        <CurrentText>
          {SEGMENTS[currentSegment]}
        </CurrentText>
      )}
      {!speaking && (
        <PlayButton onClick={() => setSpeaking(true)}>
          <FaPlay />
        </PlayButton>
      )}
    </Wrapper>
  );
}
