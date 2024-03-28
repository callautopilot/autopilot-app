import { useCallback, useState } from "react";

type AssistantStateItem = {
  transcript: string;
  transcriptIsLoading: boolean;
  answer: string;
  answerIsLoading: boolean;
  audioIsLoading: boolean;
};
type AssistantState = Record<string, AssistantStateItem>;

const defaultState = {
  "0": {
    transcript: "Hello, can you help me with something?",
    transcriptIsLoading: true,
    answer: "Sure, I can help you with that.",
    answerIsLoading: true,
    audioIsLoading: true,
  },
  "1": {
    transcript: "What do you need help with?",
    transcriptIsLoading: false,
    answer: "I need help with my homework.",
    answerIsLoading: false,
    audioIsLoading: false,
  },
};

const useAssistantState = () => {
  const [state, setState] = useState<AssistantState>({});
  console.log("state", JSON.stringify(state, null, 2));
  const onTranscriptData = useCallback(
    ({
      transcript,
      index,
      isFinal,
    }: {
      transcript: string;
      index: number;
      isFinal: boolean;
    }) => {
      setState((prevState) => {
        const newState = { ...prevState };
        newState[index] = {
          ...newState[index],
          transcript: (newState[index]?.transcript || "") + transcript,
          transcriptIsLoading: !isFinal,
        };
        return newState;
      });
    },
    []
  );

  const onAnswerData = useCallback(
    ({
      answer,
      index,
      isFinal,
    }: {
      answer: string;
      index: number;
      isFinal: boolean;
    }) => {
      setState((prevState) => {
        const newState = { ...prevState };
        newState[index] = {
          ...newState[index],
          answer: (newState[index]?.answer || "") + answer,
          answerIsLoading: !isFinal,
        };

        return newState;
      });
    },
    []
  );

  const setAudioIsFinal = useCallback((index: number, isFinal: boolean) => {
    setState((prevState) => {
      const newState = { ...prevState };
      newState[index] = {
        ...newState[index],
        audioIsLoading: !isFinal,
      };
      return newState;
    });
  }, []);

  const clearState = useCallback(() => {
    setState({});
  }, []);

  return {
    state,
    onTranscriptData,
    onAnswerData,
    setAudioIsFinal,
    clearState,
  };
};

export default useAssistantState;
