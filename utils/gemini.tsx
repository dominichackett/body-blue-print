import { GEMINI_API_KEY } from '@env';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent';
const processGeminiResponse = async (geminiData) => {
    try {
      // For non-streamed responses, you typically get a single response object
      // rather than an array of chunks
      
      // Handle if data is unexpectedly still an array
      if (Array.isArray(geminiData)) {
        return processStramedGeminiResponse(geminiData); // Use your existing function
      }
      
      // Extract text from the non-streamed response
      let fullText = '';
      
      if (geminiData?.candidates && geminiData.candidates.length > 0) {
        const candidate = geminiData.candidates[0];
        if (candidate?.content?.parts && candidate.content.parts.length > 0) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              fullText += part.text;
            }
          }
        }
      }
      
      // Process the extracted text the same way as in your streamed function
      const codeBlockMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
      const cleanedText = codeBlockMatch && codeBlockMatch[1] ? codeBlockMatch[1] : fullText;
      
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found in the response');
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error processing non-streamed Gemini response:', error);
      throw error;
    }
  };


  const processStramedGeminiResponse = async (geminiData) => {
    try {
      if (!Array.isArray(geminiData)) {
        throw new Error('Expected an array response from Gemini API');
      }

      let fullText = '';
      for (const chunk of geminiData) {
        if (chunk?.candidates && chunk.candidates.length > 0) {
          const candidate = chunk.candidates[0];
          if (candidate?.content?.parts && candidate.content.parts.length > 0) {
            for (const part of candidate.content.parts) {
              if (part.text) {
                fullText += part.text;
              }
            }
          }
        }
      }

      const codeBlockMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
      const cleanedText = codeBlockMatch && codeBlockMatch[1] ? codeBlockMatch[1] : fullText;
      
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found in the response');
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error processing Gemini response:', error);
      throw error;
    }
  };


  const generateMealPlanWithGemini = async(prompt) =>{
    const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 20000,
        }
      };
      console.log(prompt)
     
  try{
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      console.log(JSON.stringify(data))
      
    
      // Use the existing processGeminiResponse function
      const processedPlan = await processGeminiResponse(data);
      return processedPlan;
    }
   catch(error)
   {

   }
  }