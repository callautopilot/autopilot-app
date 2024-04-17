import { useState, useEffect } from 'react';

export type EnvVars = {
  OPENAI_API_KEY?: string;
  DEEPGRAM_API_KEY?: string;
  ELEVEN_LABS_API_KEY?: string;
  ELEVEN_LABS_VOICE_ID?: string;
};

function useClientEnv(): [EnvVars, (key: keyof EnvVars, value: string) => void] {
  const [env, setEnv] = useState<EnvVars>({
    OPENAI_API_KEY: '',
    DEEPGRAM_API_KEY: '',
    ELEVEN_LABS_API_KEY: '',
    ELEVEN_LABS_VOICE_ID: '',
  });

  useEffect(() => {
    setEnv({
      OPENAI_API_KEY: localStorage.getItem('OPENAI_API_KEY') || '',
      DEEPGRAM_API_KEY: localStorage.getItem('DEEPGRAM_API_KEY') || '',
      ELEVEN_LABS_API_KEY: localStorage.getItem('ELEVEN_LABS_API_KEY') || '',
      ELEVEN_LABS_VOICE_ID: localStorage.getItem('ELEVEN_LABS_VOICE_ID') || '',
    });
  }, []);

  const setEnvVar = (key: keyof EnvVars, value: string): void => {
    localStorage.setItem(key, value);
    setEnv(prev => ({ ...prev, [key]: value }));
  };

  return [env, setEnvVar];
}

export default useClientEnv;
