import styled from 'styled-components';
import { wordChunks } from 'split-word';
import { useCallback, useEffect, useState } from 'react';
import { useSpeechSynthesis } from 'react-speech-kit';

const Layout = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  flex-direction: column;
`;

const SlideLayout = styled.div`
  display: flex;
`;

const Text = styled.div`
  padding: 50px;
  font-size: 35px;
  font-family: Georgia, 'Times New Roman', Times, serif;
  flex: 1;
`;

const Picture = styled.div`
  padding: 50px;
  width: 40%;
  flex: 1;
  
  img {
    width: 100%;
  }
`;

const BreedName = styled.div`
  font-size: 180%;
  margin-bottom: 0.6em;
`;

const BreedDescription = styled.div`
  line-height: 1.4;
`;

const Word = styled.span`
  opacity: ${({ highlight }) => (highlight ? 1 : 0.2)};
  transition: 300ms all ease-out;
`;

function ReadAloudWord({
  id, word, onReading, onFinished, highlight,
}) {
  const onClick = useCallback(() => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8;
    utterance.onend = () => {
      onFinished(id);
    };
    speechSynthesis.speak(utterance);
    onReading?.(id);
  }, [word, id, onReading, onFinished]);

  return (
    <>
      <Word onClick={onClick} highlight={highlight}>{word}</Word>
      {' '}
    </>
  );
}

const ReadAloudText = ({ children }) => {
  const words = wordChunks(children);
  const [activeWordId, setActiveWord] = useState();
  const isReading = !!activeWordId;

  const onFinishedWord = useCallback((wordId) => {
    setActiveWord((curr) => (curr === wordId ? null : curr));
  }, []);

  return (
    words.map((word, i) => {
      const wordId = `${word}-${i}`;
      return (
        <ReadAloudWord
          key={wordId}
          id={wordId}
          word={word}
          onReading={setActiveWord}
          onFinished={onFinishedWord}
          highlight={!isReading || activeWordId === wordId}
        />
      );
    })
  );
};

function Slide({ title, description, id }) {
  return (
    <SlideLayout>
      <Text>
        <BreedName><ReadAloudText>{title}</ReadAloudText></BreedName>
        <BreedDescription>
          <ReadAloudText>{description}</ReadAloudText>
        </BreedDescription>
      </Text>
      <Picture>
        <img src={`/images/${id}.png`} alt="" />
      </Picture>
    </SlideLayout>
  );
}

const Controls = styled.div`
  display: flex;
`;

const slides = [
  {
    id: 'pomeranian',
    title: 'Pomeranian',
    description: 'The tiny Pomeranian, long a favorite of royals and commoners alike, has been called the ideal companion.',
  },
  {
    id: 'spitz',
    title: 'German Spitz',
    description: 'The German Spitz is always attentive, lively and exceptionally devoted to his owner.',
  },
];

function DogReader() {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const onClickNext = useCallback(() => {
    setActiveSlideIndex((curr) => (curr + 1) % slides.length);
  }, []);

  const onClickPrevious = useCallback(() => {
    setActiveSlideIndex((curr) => (curr - 1 + slides.length) % slides.length);
  }, []);

  return (
    <Layout>
      <Slide key={slides[activeSlideIndex].id} {...slides[activeSlideIndex]} />
      <Controls>
        <button onClick={onClickPrevious}>Previous</button>
        <button onClick={onClickNext}>Next</button>
      </Controls>
    </Layout>
  );
}

export default DogReader;
