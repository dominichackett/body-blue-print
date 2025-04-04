import { ANURA_API_KEY, ANURA_BASE_URL, ANURA_MODEL_ID } from '@env';
import { OpenAI } from 'openai';
import { Image } from 'react-native';

// --- Initialize OpenAI Client for Anura ---
const openai = new OpenAI({
  baseURL: ANURA_BASE_URL,
  apiKey: ANURA_API_KEY,
});

export const lilypadInference = async(prompt) => {
    try {
        const completion = await openai.chat.completions.create({
            model: ANURA_MODEL_ID,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
            max_tokens: 20000,
            response_format: { type: "json_object" },
        });

        const data = completion.choices[0]?.message?.content;

        if (!data) {
            throw new Error("Received empty response content from Anura Testnet.");
        }
        
        return JSON.parse(data);

    } catch(error) {
       console.log("Error Processing", error);
       return null;
    }
};

// Helper function to check if an image URL is valid
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.match(/^(http|https):\/\/[^ "]+$/);
};

// Helper function to pre-check if an image exists
const checkImageExists = async (imageUrl) => {
  return new Promise((resolve) => {
    if (!isValidImageUrl(imageUrl)) {
      resolve(false);
      return;
    }
    
    Image.prefetch(imageUrl)
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
};

export const processLilyPadResponse = async(lilypadData) => {
  try {
    // Verify the structure - we expect exercises array
    if (!lilypadData.exercises || !Array.isArray(lilypadData.exercises)) {
      throw new Error('Invalid exercise data structure: missing exercises array');
    }
    
    // Process the exercises
    const processedExercises = await Promise.all(lilypadData.exercises.map(async exercise => {
      const imageUrl = exercise.imageUrl;
      const imageExists = await checkImageExists(imageUrl);
      
      // Validate expected fields and provide defaults if missing
      return {
        name: exercise.name || 'Unknown Exercise',
        description: exercise.description || 'No description available',
        difficulty: exercise.difficulty || 'Moderate',
        sets: exercise.sets || '3',
        reps: exercise.reps || '10-12',
        benefits: exercise.benefits || '',
        // Use placeholder image if URL is missing, invalid, or fails to load
        image: imageExists ? { uri: imageUrl } : require('../assets/images/placeholder.png'),
        youtubeVideoId: exercise.youtubeVideoId || ''
      };
    }));
    
    return processedExercises;
  } catch (parseError) {
    console.error('Error parsing JSON:', parseError);
    throw new Error('Failed to parse JSON from Gemini response');
  }
};

// Alternative simpler approach if pre-checking images is too heavy
export const processLilyPadResponseSimple = async(lilypadData) => {
  try {
    // Verify the structure - we expect exercises array
    if (!lilypadData.exercises || !Array.isArray(lilypadData.exercises)) {
      throw new Error('Invalid exercise data structure: missing exercises array');
    }
    
    // Process the exercises
    const processedExercises = lilypadData.exercises.map(exercise => {
      const imageUrl = exercise.imageUrl;
      const isValid = isValidImageUrl(imageUrl);
      
      // Validate expected fields and provide defaults if missing
      return {
        name: exercise.name || 'Unknown Exercise',
        description: exercise.description || 'No description available',
        difficulty: exercise.difficulty || 'Moderate',
        sets: exercise.sets || '3',
        reps: exercise.reps || '10-12',
        benefits: exercise.benefits || '',
        // Use placeholder image if URL is missing or invalid format
        image: isValid ? { uri: imageUrl } : require('../assets/images/placeholder.png'),
        fallbackImage: require('../assets/images/placeholder.png'),
        hasValidImageUrl: isValid,
        youtubeVideoId: exercise.youtubeVideoId || ''
      };
    });
    
    return processedExercises;
  } catch (parseError) {
    console.error('Error parsing JSON:', parseError);
    throw new Error('Failed to parse JSON from Gemini response');
  }
};