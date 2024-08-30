
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const uploadImageToGemini = async (filePath: string, mimeType: string, displayName: string): Promise<string> => {
  const uploadResponse = await fileManager.uploadFile(filePath, { mimeType, displayName });
  return uploadResponse.file.uri;
};

export const extractMeasurementFromImage = async (fileUri: string, mimeType: string): Promise<number> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent([
    { fileData: { mimeType, fileUri } },
    { text: 'Extract only the numeric measurement value from this image, as a single number.' },
  ]);

  const responseText = result.response.text().trim();
  const measureValue = parseFloat(responseText);

  if (isNaN(measureValue)) {
    throw new Error('Valor de medida inválido');
  }

  return measureValue;
};
