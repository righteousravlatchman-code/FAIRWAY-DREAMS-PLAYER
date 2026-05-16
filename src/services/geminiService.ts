import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface FrequencyReportData {
  name: string;
  birthDate: string;
}

export async function generateFrequencyReport(data: FrequencyReportData) {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Generate a detailed "Multi-Dimensional Frequency Report" for an individual with the following details:
    Name: ${data.name}
    Birth Date: ${data.birthDate}

    The report should be structured in the following sections, synthesizing insights from **GG33, Dolores Cannon, Carl Jung, the Monroe Institute, Nostradamus, and Mystic Rebels Astrology**:
    1. **Core Vibration (Numerology & GG33)**: Deeply analyze their Life Path, Expression, and Soul Urge numbers. Explain the interaction between these frequencies through the GG33 framework.
    2. **Celestial Alignment (Mystic Rebels Astrology)**: Discuss their Sun, Moon, and Rising signs. Include insights from Vedic (Nakshatra), Arabian (Manzils), Druid (Tree Sign), and Mayan (Tzolkin) traditions as synthesized by Mystic Rebels.
    3. **Psychological Landscape (Jungian Archetypes)**: Identify their primary Jungian archetypes and how they interact with their current astrological/numerological cycle.
    4. **Metaphysical Mission (Dolores Cannon Wisdom)**: Provide insights into their soul's purpose and "Subconscious" guidance based on Cannon's teachings.
    5. **Strategic Life Management (Mission Control)**: Provide actionable, strategic advice for their current Personal Year, Month, and Day. Focus on timing and rhythm, potentially referencing Nostradamus's cycles.
    6. **Energetic Signature & Focus (Monroe Institute)**: Discuss their resonant "Focus levels" and how they can achieve Hemi-Sync states tailored to their frequency.
    7. **Harmonic Resonance**: Suggest specific frequencies (Hz), musical styles, and solfeggio tones that align with their energetic signature.
    8. **Daily Directive**: A short, powerful mantra and a specific physical action for today to ground their frequency.

    Format the response in clean, beautiful Markdown with clear headings and bullet points. Use a professional, mystical, and strategic tone that feels like a "Mission Control" briefing for their life.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error generating frequency report:", error);
    throw new Error("Failed to generate the frequency report. Please try again later.");
  }
}

export async function generateReportAudio(reportText: string) {
  // We should create a condensed version for audio briefing
  const modelContent = "gemini-3-flash-preview";
  const ttsModel = "gemini-3.1-flash-tts-preview";

  try {
    // 1. Condense the report into a short briefing script
    const condensationPrompt = `
      Based on the following Frequency Report, write a concise, powerful 1-2 minute "Mission Control Audio Briefing" script.
      Speak directly to the user. Start with "Greetings [Name], this is your Multi-Dimensional Frequency Briefing for today."
      Highlight the most important Core Vibration, Celestial Alignment, and the Daily Directive.
      Keep it mystical yet strategic and professional.
      
      REPORT:
      ${reportText}
    `;

    const summaryResponse = await ai.models.generateContent({
      model: modelContent,
      contents: [{ parts: [{ text: condensationPrompt }] }],
    });

    const script = summaryResponse.text || "Your briefing is ready.";

    // 2. Generate TTS
    const ttsResponse = await ai.models.generateContent({
      model: ttsModel,
      contents: [{ parts: [{ text: script }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Professional and clear
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data generated");

    // Convert base64 to Blob URL
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    // Note: Gemini 3.1 TTS returns raw PCM by default or a container?
    // Skill says: "// ... decode and play audio with sample rate 24000 ..."
    // Usually it needs a header if playing via <audio> or we use AudioContext.
    // However, for simplicity if I can get a WAV/MP3 it's better.
    // The skill doesn't specify the mime type for TTS inlineData.
    
    return {
      audioData: base64Audio,
      script: script
    };
  } catch (error) {
    console.error("Error generating audio briefing:", error);
    throw error;
  }
}

export async function getHebrewName(name: string): Promise<string> {
  const model = "gemini-3.1-pro-preview";
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: `Transliterate the following name into Hebrew script. Output ONLY the Hebrew characters smoothly without any surrounding quotes, text, or explanations. Name: ${name}` }] }],
      config: {
        temperature: 0.1,
      }
    });
    return response.text?.trim() || name;
  } catch (error) {
    console.warn("Could not transliterate to Hebrew:", error);
    return name;
  }
}
