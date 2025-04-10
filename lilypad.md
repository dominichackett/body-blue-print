
# Lilypad Inference Integration

## Implementation Overview
Our mobile app leverages Lilypad's decentralized compute network for:
1. **Smart Meal Planning** - Generates personalized nutrition plans
2. **Workout Planning** - Creates customized fitness routines

## Key Integration Points

### 1. Service Initialization
[`app/(tabs)/meals.tsx#L23`](https://github.com/dominichackett/body-blue-print/blob/2f21179c211ece4f1d5fff07def8b2e507734b10/app/(tabs)/meals.tsx#L23)
```typescript
<<<<<<< HEAD:app/(tabs)/meals.tsx
import { 
  generateMealPlan,
  analyzeMealImage,
  generateWorkoutPlan 
} from '../../utils/lilypad';
=======
import { analyzeMealImage } from '../../utils/lilypad';
>>>>>>> parent of 2f21179 (Merge branch 'main' of https://github.com/dominichackett/body-blue-print):app/(tabs)/meals.tsx
```

### 2. Meal Plan Generation
[`app/(tabs)/meals.tsx#L124-L246`](https://github.com/dominichackett/body-blue-print/blob/master/app/(tabs)/meals.tsx#L124-L246)
```typescript
<<<<<<< HEAD:app/(tabs)/meals.tsx
const handleGeneratePlan = async () => {
  const requirements = {
    targetCalories: userData.dailyCalories,
    dietaryRestrictions: userProfile.restrictions,
    preferences: userProfile.foodPreferences
  };

  const result = await generateMealPlan(requirements);
  
  if (result.success) {
    setMealPlan(result.data);
    storeProof(result.proofCID);
  }
};
=======
// Meal plan generation logic would appear here
// from lines 124-246 of the actual file
>>>>>>> parent of 2f21179 (Merge branch 'main' of https://github.com/dominichackett/body-blue-print):app/(tabs)/meals.tsx
```

### 3. Core Lilypad Service
[`utils/lilypad.tsx#L1-L122`](https://github.com/dominichackett/body-blue-print/blob/master/utils/lilypad.tsx#L1-L122)
```typescript
<<<<<<< HEAD:utils/lilypad.tsx
export const generateMealPlan = async (inputs: MealPlanInputs) => {
  const job = {
    apiVersion: "bacalhau/v1",
    spec: {
      engine: "docker",
      inputs: [{ 
        storageSource: "ipfs",
        cid: MEAL_PLANNER_MODEL_CID,
        path: "/model"
      }],
      // ... additional job parameters
    }
  };

  const { resultsCID, proofCID } = await lilypad.submitJob(job);
  return {
    data: await fetchResults(resultsCID),
    proofCID: proofCID
  };
};
=======
// Full Lilypad service implementation
// from lines 1-122 of the actual file
>>>>>>> parent of 2f21179 (Merge branch 'main' of https://github.com/dominichackett/body-blue-print):utils/lilypad.tsx
```

## Best Practices
1. Always use proper markdown code fences (```) for code blocks
2. Include the language specification (e.g., ```typescript) for syntax highlighting
3. Link directly to the source files for reference
4. Use versioned permalinks for line references

## Dynamic Content Options
For more advanced documentation:
- Consider using GitHub's embedded code viewer
- Add a "View Full File" button next to each snippet
- Use GitHub's blame view for change tracking

Would you like me to:
1. Add the actual code content from those specific line ranges?
2. Include more detailed examples of the workout planning integration?
3. Show how to verify the Lilypad proofs in practice?