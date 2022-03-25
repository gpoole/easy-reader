const say = (text, rate) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  speechSynthesis.speak(utterance);

  return new Promise((resolve) => {
    utterance.onend = resolve;
  });
};

export default say;
