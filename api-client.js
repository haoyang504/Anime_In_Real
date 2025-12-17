/**
 * Gemini API Client
 * Handles communication with Google's Generative Language API
 */

export class GeminiApiClient {
    constructor() {
        this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
        // Using the model ID that was verified to work
        this.modelName = "gemini-3-pro-image-preview";
    }

    /**
     * Generate a composite image using Gemini
     * @param {string} apiKey - User's Google AI Studio API Key
     * @param {string} animeImageBase64 - Base64 string of the anime character image (no prefix)
     * @param {string} bgImageBase64 - Base64 string of the background image (no prefix)
     * @param {string} prompt - The text prompt for generation
     * @returns {Promise<string>} - Base64 string of the generated image
     */
    async generateCompositeImage(apiKey, animeImageBase64, bgImageBase64, prompt) {
        if (!apiKey) throw new Error("API Key is required");

        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: animeImageBase64
                        }
                    },
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: bgImageBase64
                        }
                    }
                ]
            }],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ],
            generationConfig: {
                // Add any specific config if needed in future
            }
        };

        try {
            const response = await fetch(`${this.baseUrl}/${this.modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || "API Error");
            }

            if (!data.candidates || data.candidates.length === 0) {
                if (data.promptFeedback) {
                    throw new Error("Blocked by safety filters: " + JSON.stringify(data.promptFeedback));
                }
                throw new Error("No image generated. The model might have refused the request.");
            }

            const candidate = data.candidates[0];
            const parts = candidate.content.parts;

            for (const part of parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }

            throw new Error("Model returned text instead of image. Please try adjusting the prompt.");

        } catch (error) {
            console.error("Gemini API Error:", error);
            throw error;
        }
    }
}

export const geminiClient = new GeminiApiClient();
