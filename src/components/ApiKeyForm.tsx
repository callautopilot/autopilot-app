import { useState, useEffect } from 'react';
//import useClientEnv from '@/app/hooks/useClientEnv';
import { EnvVars } from '@/app/hooks/useClientEnv';


const ApiKeyForm = () => {
  const [error, setError] = useState<string>('');

  // Initializing state from localStorage
  const [keys, setKeys] = useState({
    openAIKey: localStorage.getItem('OPENAI_API_KEY') || '',
    deepgramKey: localStorage.getItem('DEEPGRAM_API_KEY') || '',
    elevenLabsKey: localStorage.getItem('ELEVEN_LABS_API_KEY') || '',
    elevenLabsVoiceID: localStorage.getItem('ELEVEN_LABS_VOICE_ID') || '',
  });

  useEffect(() => {
    // Sync state to localStorage when component mounts
    // Refreshes current session values if env vars have updated defaults
    localStorage.setItem('OPENAI_API_KEY', keys.openAIKey);
    localStorage.setItem('DEEPGRAM_API_KEY', keys.deepgramKey);
    localStorage.setItem('ELEVEN_LABS_API_KEY', keys.elevenLabsKey);
    localStorage.setItem('ELEVEN_LABS_VOICE_ID', keys.elevenLabsVoiceID);
  }, []);

  useEffect(() => {
    // Check if all keys are empty and set an error message if they are
    if (!keys.openAIKey || !keys.deepgramKey || !keys.elevenLabsKey || !keys.elevenLabsVoiceID) {
      setError('API keys are missing, please configure them below');
    } else {
      setError('');
    }
  }, [keys]);

  const handleInputChange = (field: keyof EnvVars, value: string) => {
    const fieldMap: Record<keyof EnvVars, string> = {
      openAIKey: 'OPENAI_API_KEY',
      deepgramKey: 'DEEPGRAM_API_KEY',
      elevenLabsKey: 'ELEVEN_LABS_API_KEY',
      elevenLabsVoiceID: 'ELEVEN_LABS_VOICE_ID',
    };

    setKeys(prev => ({ ...prev, [field]: value }));
    localStorage.setItem(fieldMap[field], value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    alert('API Keys have been updated successfully! The app will now reload.');
    window.location.reload();
  };

  const handleReset = () => {
    // Reset keys
    setKeys({
      openAIKey: '',
      deepgramKey: '',
      elevenLabsKey: '',
      elevenLabsVoiceID: '',
    });

    // Clear local storage
    localStorage.removeItem('OPENAI_API_KEY');
    localStorage.removeItem('DEEPGRAM_API_KEY');
    localStorage.removeItem('ELEVEN_LABS_API_KEY');
    localStorage.removeItem('ELEVEN_LABS_VOICE_ID');
  };

  return (
    <div>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="openAIKey" className="block text-sm font-medium text-gray-700">
            OpenAI API Key
          </label>
          <input
            id="openAIKey"
            type="text"
            value={keys.openAIKey ? keys.openAIKey : ''}
            onChange={(e) => handleInputChange('openAIKey', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="deepgramKey" className="block text-sm font-medium text-gray-700">
            Deepgram API Key
          </label>
          <input
            id="deepgramKey"
            type="text"
            value={keys.deepgramKey ? keys.deepgramKey : ''}
            onChange={(e) => handleInputChange('deepgramKey', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="elevenLabsKey" className="block text-sm font-medium text-gray-700">
            Eleven Labs API Key
          </label>
          <input
            id="elevenLabsKey"
            type="text"
            value={keys.elevenLabsKey ? keys.elevenLabsKey : ''}
            onChange={(e) => handleInputChange('elevenLabsKey', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="elevenLabsVoiceID" className="block text-sm font-medium text-gray-700">
            Eleven Labs Voice ID
          </label>
          <input
            id="elevenLabsVoiceID"
            type="text"
            value={keys.elevenLabsVoiceID ? keys.elevenLabsVoiceID : ''}
            onChange={(e) => handleInputChange('elevenLabsVoiceID', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          Save & Reload App
        </button>
        <button type="button" onClick={handleReset} className="ml-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
          Reset API Keys
        </button>
      </form>
    </div>
  );
};

export default ApiKeyForm;
