import { useState, useEffect } from 'react';
import useClientEnv from '@/app/hooks/useClientEnv';


const ApiKeyForm = () => {
  const [error, setError] = useState<string>('');
  const [envVars, setEnvVar] = useClientEnv();

  useEffect(() => {
    // Check if all keys are empty and set an error message if they are
    if (!envVars.OPENAI_API_KEY || !envVars.DEEPGRAM_API_KEY || !envVars.ELEVEN_LABS_API_KEY || !envVars.ELEVEN_LABS_VOICE_ID) {
      setError('API keys are missing, please configure them below');
    } else {
      setError('');
    }
  }, [envVars]);

  const handleInputChange = (field: keyof typeof envVars, value: string) => {
    console.log("change value:", value, "form field:", field);
    setEnvVar(field, value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    alert('API Keys have been updated successfully! The app will now reload.');
    window.location.reload();
  };

  const handleReset = () => {
    // Reset keys by setting them to empty strings
    setEnvVar('OPENAI_API_KEY', '');
    setEnvVar('DEEPGRAM_API_KEY', '');
    setEnvVar('ELEVEN_LABS_API_KEY', '');
    setEnvVar('ELEVEN_LABS_VOICE_ID', '');
    setError('API keys have been reset.');
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
            value={envVars.OPENAI_API_KEY || ''}
            onChange={(e) => handleInputChange('OPENAI_API_KEY', e.target.value)}
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
            value={envVars.DEEPGRAM_API_KEY || ''}
            onChange={(e) => handleInputChange('DEEPGRAM_API_KEY', e.target.value)}
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
            value={envVars.ELEVEN_LABS_API_KEY || ''}
            onChange={(e) => handleInputChange('ELEVEN_LABS_API_KEY', e.target.value)}
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
            value={envVars.ELEVEN_LABS_VOICE_ID || ''}
            onChange={(e) => handleInputChange('ELEVEN_LABS_VOICE_ID', e.target.value)}
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
