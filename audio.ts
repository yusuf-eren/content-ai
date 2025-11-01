import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import OpenAI from 'openai';

const elevenlabs = new ElevenLabsClient();
const openai = new OpenAI();

/**
 * Man, this is so expensive to use. :(
 * If you are a guy working @ elevenlabs, please send me credits :D
*/
export async function generateAudio(
  text: string
): Promise<ReadableStream<Uint8Array>> {
  const audio = await elevenlabs.textToSpeech.stream('kdmDKE6EkgrWrrykO9Qt', {
    text,
    modelId: 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_128',
  });

  return audio;
}

export async function generateAudioOpenAI(text: string): Promise<string> {
  const response = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    input: text,
    instructions: 'Speak in a clear and concise manner, with an excited tone.',
    voice: 'nova',
    response_format: 'mp3',
  });

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}
