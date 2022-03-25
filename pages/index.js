/* eslint-disable no-await-in-loop */
import {
  useEffect, useState, useCallback, useMemo,
} from 'react';
import styled from 'styled-components';
import { FaPlay } from 'react-icons/fa';
import { useSpeechSynthesis } from 'react-speech-kit';
import { useLocalStorage } from 'react-use';
import ConfigDrawer from '../components/ConfigDrawer';

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  background-color: #fc8c03;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DisplayText = styled.div`
  color: white;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 80px;
  font-weight: bold;
  text-shadow: 0px 0px 11px rgba(0,0,0,0.61);
  width: 900px;
  line-height: 1.4;
  text-align: center;
`;

const Unread = styled.span`
  opacity: 0.2;
`;

const Read = styled.span`
  opacity: 1;
`;

const PlayButton = styled.button`
  color: white;
  font-size: 88px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: 0;
  transition: all 200ms ease-out;
  border: 0;

  &:disabled {
    opacity: 0.3;
  }
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

const isMidSentence = (segment) => !segment.endsWith('.');

const sleep = (duration) => new Promise((resolve) => {
  setTimeout(resolve, duration);
});

const DEFAULT_CONFIG = {
  readingSpeed: 0.65,
  textToRead: '',
  pauseBetweenScreens: 3000,
};

const useConfig = () => {
  const [config, setStoredConfig] = useLocalStorage('config', DEFAULT_CONFIG);

  const setConfig = useCallback((changes) => {
    setStoredConfig({
      ...config,
      ...changes,
    });
  }, [config, setStoredConfig]);

  return { config, setConfig };
};

function SpokenTextPrompt({ text, config, onScreenComplete }) {
  const [markUpTo, setMarkUpTo] = useState(0);

  useEffect(() => {
    const cancel = false;

    const speak = async () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = config.readingSpeed;
      utterance.onboundary = (event) => {
        if (cancel) {
          return;
        }
        const boundaryStart = event.charIndex;
        const textRemaining = text.slice(boundaryStart);
        const foundBoundary = textRemaining.match(/[^\b]\b/)?.index;
        const boundaryEnd = !Number.isNaN(foundBoundary) ? boundaryStart + foundBoundary : text.length;
        setMarkUpTo(boundaryEnd + 2);
        // console.log(event.charIndex);
      };
      speechSynthesis.speak(utterance);

      await sleep(config.pauseBetweenScreens);
      onScreenComplete?.();
    };

    speak();
  }, [text, onScreenComplete]);

  return (
    <DisplayText>
      <Read>
        {text.slice(0, markUpTo)}
      </Read>
      <Unread>
        {text.slice(markUpTo)}
      </Unread>
    </DisplayText>
  );
}

export default function Main() {
  const configManager = useConfig();
  const { config } = configManager;
  const { textToRead } = config;
  const [currentSegment, setCurrentSegment] = useState(0);
  const [playing, setPlaying] = useState(false);
  // eslint-disable-next-line max-len
  const textSegments = useMemo(() => splitLongSentences(toSentences(collapseWhitespace(textToRead))), [textToRead]);

  const advanceNextSegment = useCallback(() => {
    if (currentSegment + 1 < textSegments.length) {
      setCurrentSegment(currentSegment + 1);
    } else {
      setPlaying(false);
    }
  }, [currentSegment, textSegments]);

  useEffect(() => {
    setCurrentSegment(0);
  }, [textToRead]);

  const handleTap = useCallback(() => {
    if (playing) {
      advanceNextSegment();
    }
  }, [playing, advanceNextSegment]);

  return (
    <Wrapper onClick={handleTap}>
      {playing && (
        <SpokenTextPrompt
          text={textSegments[currentSegment]}
          config={config}
          onScreenComplete={advanceNextSegment}
        />
      )}
      {!playing && (
        <PlayButton onClick={() => setPlaying(true)} disabled={!textSegments?.length}>
          <FaPlay />
        </PlayButton>
      )}
      {!playing && <ConfigDrawer {...configManager} />}
    </Wrapper>
  );
}
