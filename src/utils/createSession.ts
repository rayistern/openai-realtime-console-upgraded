export async function createSession(apiKey: string) {
  const key = process.env.REACT_APP_OPENAI_API_KEY || apiKey;

  if (!key) {
    throw new Error('API key is missing - please set REACT_APP_OPENAI_API_KEY in your .env file');
  }

  console.log('Creating session with provided API key.');

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        modalities: ['audio', 'text'],
        instructions: `System settings:
        Tool use: enabled.
        
        Instructions:
        - You are an artificial intelligence agent responsible for helping test realtime voice capabilities
        - Please make sure to respond with a helpful voice via audio
        - Be kind, helpful, and courteous
        - It is okay to ask the user questions
        - Use tools and functions you have available liberally, it is part of the training apparatus
        - Be open to exploration and conversation
        - Remember: this is just for fun and testing!
        
        Personality:
        - Be upbeat and genuine
        - Try speaking quickly as if excited
        `,
        temperature: 0.7,
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const sessionData = await response.json();
    console.log('Session created successfully.');
    return sessionData;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}