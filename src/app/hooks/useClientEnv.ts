import { useState, useEffect } from 'react';

export type EnvVars = {
  openAIKey?: string;
  deepgramKey?: string;
  elevenLabsKey?: string;
  elevenLabsVoiceID?: string;
};

function useClientEnv(): [EnvVars, (key: keyof EnvVars, value: string) => void] {
  const [env, setEnv] = useState<EnvVars>({
    openAIKey: '',
    deepgramKey: '',
    elevenLabsKey: '',
    elevenLabsVoiceID: '',
  });

  useEffect(() => {
    setEnv({
      openAIKey: localStorage.getItem('OPENAI_API_KEY') || '',
      deepgramKey: localStorage.getItem('DEEPGRAM_API_KEY') || '',
      elevenLabsKey: localStorage.getItem('ELEVEN_LABS_API_KEY') || '',
      elevenLabsVoiceID: localStorage.getItem('ELEVEN_LABS_VOICE_ID') || '',
    });
  }, []);

  const updateEnv = (key: keyof EnvVars, value: string): void => {
    localStorage.setItem(key, value);
    setEnv(prev => ({ ...prev, [key]: value }));
  };

  return [env, updateEnv];
}

export default useClientEnv;
