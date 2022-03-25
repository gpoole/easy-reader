import { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { FaPlay } from 'react-icons/fa';
import { useLocalstorage } from 'rooks';
import ConfigDrawer from '../components/ConfigDrawer';
import say from '../lib/say';

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

const isMidSentence = (segment) => !segment.endsWith('.');

const sleep = (duration) => new Promise((resolve) => {
  setTimeout(resolve, duration);
});

const DEFAULT_CONFIG = {
  readingSpeed: 0.65,
  textToRead: '',
};

const useConfig = () => {
  const [storedConfig, setStoredConfig] = useLocalstorage('config', DEFAULT_CONFIG);

  const config = storedConfig || DEFAULT_CONFIG;

  const setConfig = useCallback((changes) => {
    setStoredConfig({
      ...config,
      ...changes,
    });
  }, [config, setStoredConfig]);

  return { config, setConfig };
};

export default function Main() {
  const configManager = useConfig();
  const [textSegments, setTextSegments] = useState([]);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  const { textToRead } = configManager.config;

  const nextSegment = useCallback(() => {
    if (currentSegment + 1 < textToRead.length) {
      setCurrentSegment(currentSegment + 1);
    } else {
      setSpeaking(false);
    }
  }, [currentSegment, textToRead]);

  useEffect(() => {
    speechSynthesis.cancel();
    setCurrentSegment(0);
    const processedText = splitLongSentences(toSentences(collapseWhitespace(textToRead)));
    setTextSegments(processedText);
  }, [textToRead]);

  useEffect(() => {
    let cancel = false;

    const sayNext = async () => {
      const segment = textSegments[currentSegment];
      await say(segment, configManager.config.readingSpeed);
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
  }, [currentSegment, speaking, textSegments, configManager.config, nextSegment]);

  const handleTap = useCallback(() => {
    if (speaking) {
      speechSynthesis.cancel();
      nextSegment();
    }
  }, [speaking, nextSegment]);

  return (
    <Wrapper onClick={handleTap}>
      {speaking && (
        <CurrentText>
          {textSegments[currentSegment]}
        </CurrentText>
      )}
      {!speaking && (
        <PlayButton onClick={() => setSpeaking(true)}>
          <FaPlay />
        </PlayButton>
      )}
      {!speaking && <ConfigDrawer {...configManager} />}
    </Wrapper>
  );
}
