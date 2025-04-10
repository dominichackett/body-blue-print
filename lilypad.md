# Lilypad Inference Integration

## Implementation Overview
Our mobile app uses Lilypad for decentralized AI processing in two key flows:
1. **Smart Meal Planning** - Personalized meal plan generation
2. **Workout Planning** - Personalized workout plan generation


## Key Integration Points

### 1. Meal Analysis Initialization
The meal analysis flow begins in the meals screen component:

[`app/(tabs)/meals.tsx`](https://github.com/dominichackett/body-blue-print/blob/2f21179c211ece4f1d5fff07def8b2e507734b10/app/(tabs)/meals.tsx#L23)
```typescript
import { analyzeMealImage } from '../../utils/lilypad';
```

### 2. Meal Plan Generation
The complete meal planning workflow:

[`app/(tabs)/meals.tsx`](https://github.com/dominichackett/body-blue-print/blob/master/app/(tabs)/meals.tsx#L124-L246)
```typescript
const generateMealPlan = async () => {
  try {
    const plan = await callLilypadMealPlanner({
      userGoals: currentGoals,
      dietaryRestrictions,
      preferredFoods
    });
    setGeneratedPlan(plan);
  } catch (error) {
    showError("Failed to generate decentralized meal plan");
  }
};
```

### 3. Core Lilypad Service
The complete Lilypad interaction layer:

[`utils/lilypad.tsx`](https://github.com/dominichackett/body-blue-print/blob/master/utils/lilypad.tsx#L1-L122)
```typescript
export const callLilypadMealPlanner = async (inputs: MealPlanInputs) => {
  const jobSpec = {
    apiVersion: "bacalhau/v1",
    spec: {
      engine: "docker",
      inputs: [
        {
          storageSource: "ipfs",
          cid: MEAL_PLANNER_MODEL_CID,
          path: "/inputs"
        }
      ],
      // ... full job specification
    }
  };

  const { jobId, resultsCid } = await lilypad.submitJob(jobSpec);
  return await pollForJobCompletion(jobId, resultsCid);
};
```
