import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBirthdayMessage = async (name: string, age: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Escreva uma mensagem de aniversário emocionante, inspiradora e pessoal para o meu pai, chamado ${name}, que está completando ${age} anos hoje. 
      A mensagem deve ser em Português do Brasil. 
      Use um tom de celebração, gratidão e amor de filho(a) para pai. 
      Mantenha a mensagem com no máximo 3 parágrafos curtos.`,
    });

    return response.text || "Feliz aniversário! Que seu dia seja repleto de alegria e paz.";
  } catch (error) {
    console.error("Error generating message:", error);
    return "Pai, você é nosso herói! Parabéns pelos seus 58 anos. Te amamos muito!";
  }
};