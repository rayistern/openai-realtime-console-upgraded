export async function createSession(apiKey: string) {
  if (!apiKey) {
    throw new Error('API key is missing');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create session: ${response.statusText} - ${errorText}`);
    }

    const sessionData = await response.json();
    return sessionData;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
} 