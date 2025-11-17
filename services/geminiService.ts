
import { GoogleGenAI, Chat, GroundingChunk } from "@google/genai";

// FIX: Use process.env.API_KEY to align with coding guidelines and resolve TypeScript error.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chatInstance: Chat | null = null;
let lastContextData: string | null = null;

export const getLocationInfo = async (latitude: number, longitude: number): Promise<{description: string, mapUri?: string}> => {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Proporciona la dirección o el nombre del lugar más preciso y conciso para las coordenadas: ${latitude}, ${longitude}. Limita la respuesta a una sola línea.`,
        config: {
            tools: [{googleMaps: {}}],
            toolConfig: {
                retrievalConfig: {
                    latLng: { latitude, longitude }
                }
            }
        },
    });

    const text = response.text;
    const groundingChunks: GroundingChunk[] | undefined = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const mapChunk = groundingChunks?.find(chunk => chunk.maps);

    return {
      description: text || "No se pudieron recuperar los detalles de la ubicación.",
      mapUri: mapChunk?.maps?.uri
    };
  } catch (error) {
    console.error("Error fetching location info from Gemini:", error);
    return { description: "No se pudieron obtener los detalles de la ubicación debido a un error de la API." };
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

// FIX: Re-initialize chat only if context data has changed to maintain conversation history.
const initializeChat = (contextData: string) => {
    if (!chatInstance || contextData !== lastContextData) {
        chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `Eres un asistente útil para un administrador de empresas. Tu función es responder preguntas sobre el seguimiento del tiempo de los empleados y los datos de los contratistas. Utiliza los datos proporcionados para responder a las preguntas con precisión. Los datos son: ${contextData}`,
            },
        });
        lastContextData = contextData;
    }
};

// FIX: Removed unused 'history' parameter. Chat history is managed by the chatInstance.
export const getChatbotResponse = async (newMessage: string, contextData: string): Promise<string> => {
    initializeChat(contextData);
    
    if (!chatInstance) {
      throw new Error("El chat no pudo ser inicializado.");
    }

    const response = await chatInstance.sendMessage({ message: newMessage });
    return response.text;
};
