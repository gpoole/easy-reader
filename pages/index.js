import { useEffect, useState } from 'react';
import styled from 'styled-components';

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
When the last of her five children was about to fly the nest, Pam Willis wondered what she'd do with all the empty bedrooms in her house.

Then, she read a news story on Facebook about seven siblings who needed a home that changed everything....

Here she tells her story in her own words.

Lying in bed with my husband, Gary, then 50, we were reminiscing.

Together since I was 15 and Gary was 17, we’d met when my friend brought him into the yoghurt shop where I worked after school.

He’s cute, I thought, begging my friend to set us up.

Tying the knot 18 months later, in 1988, we couldn’t wait to start a family.

‘We’re going to end up with 10 kids,’ I often joked.

Fast forward 31 years, we were now proud parents to Matthew, 31, Andrew, 28, Alexa, 25, Sophia, 21, and Samuel, 18.

Our four eldest kids had flown the coop, and Samuel, in his final year of school, was preparing to follow in their footsteps.

With six bedrooms, Gary and I wondered what we would do once we became empty-nesters.

‘Maybe we should sell the house,’ Gary suggested.

But over the next six months, we never got around to it.

Plus, we were busy as foster carers, which we’d done for the past five years.

Though I loved every child who stayed with us, we had no plans to have any youngsters permanently.

After all, we’d raised five kids already.
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

  useEffect(() => {
    let cancel = false;

    const sayNext = async () => {
      const segment = SEGMENTS[currentSegment];
      await say(segment);
      await sleep(isMidSentence(segment) ? 200 : 1000);
      if (cancel) {
        return;
      }
      setCurrentSegment(currentSegment + 1);
    };

    sayNext();

    return () => {
      cancel = true;
    };
  }, [currentSegment]);

  return (
    <Wrapper>
      <CurrentText>
        {SEGMENTS[currentSegment]}
      </CurrentText>
    </Wrapper>
  );
}
