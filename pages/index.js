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

const collapseWhitespace = (text) => trim(text).replace(LINES_PATTERN, ' ');

const toSentences = (text) => {
  let remaining = text;
  const sentences = [];
  while (remaining) {
    const found = remaining.match(/[\.\?\!]\s/)?.index;
    const end = found || remaining.length;
    const sentence = remaining.slice(0, end + 1);
    remaining = remaining.slice(end + 1);
    sentences.push(sentence);
  }
  return sentences;
};

const LONG_SENTENCE = 30;

const splitLongSentences = (sentences) => sentences.reduce((acc, sentence) => {
  if (sentence.length < LONG_SENTENCE) {
    return [
      ...acc,
      sentence,
    ];
  }

  let remaining = sentence;
  const parts = [];
  let offset = 0;
  while (remaining) {
    const found = remaining.slice(offset).match(/, /)?.index;
    const end = found !== undefined ? (found + offset + 2) : remaining.length;
    if (found && end < LONG_SENTENCE) {
      offset = offset + end + 2;
      continue;
    }
    const part = remaining.slice(0, end);
    parts.push(part);
    remaining = remaining.slice(end);
    offset = 0;
  }

  return [
    ...acc,
    ...parts,
  ];
}, []);

const sleep = (duration) => new Promise((resolve) => {
  setTimeout(resolve, duration);
});

const DEFAULT_CONFIG = {
  readingSpeed: 0.65,
  textToRead: '',
  pauseBetweenScreens: 1000,
  pauseAfterSentence: 3000,
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
    let cancel = false;

    const speak = async () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = config.readingSpeed;
      utterance.onboundary = (event) => {
        if (cancel) {
          return;
        }
        const boundaryStart = event.charIndex;
        const textRemaining = text.slice(boundaryStart);
        const foundBoundary = textRemaining.match(/[^\b] /)?.index;
        const boundaryEnd = foundBoundary !== undefined ? boundaryStart + foundBoundary + 2 : text.length;
        // It's no secret that dogs are a man's best friend. 29 49
        setMarkUpTo(boundaryEnd);
        // console.log(event.charIndex);
      };

      speechSynthesis.speak(utterance);

      return new Promise((resolve) => {
        utterance.onend = resolve;
      });
    };

    const speakAndPause = async () => {
      await speak();
      const isEndOfSentence = text.endsWith('.');
      await sleep(isEndOfSentence ? config.pauseAfterSentence : config.pauseBetweenScreens);

      if (cancel) {
        return;
      }

      onScreenComplete?.();
    };

    speakAndPause();

    return () => {
      cancel = true;
      window.speechSynthesis.cancel();
    };
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
      setCurrentSegment(0);
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
          key={textSegments[currentSegment]}
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
