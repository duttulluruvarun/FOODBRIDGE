/**
 * Mocks an AI function that analyzes an image of food and determines quality.
 */
export async function analyzeFoodImage(imageUrl: string): Promise<{
  qualityScore: number;
  category: string;
  isSafe: boolean;
}> {
  // Mocked AI output based on random chance for the hackathon
  const rand = Math.random();
  let qualityScore = 0.95;
  let category = "cooked";
  let isSafe = true;

  if (rand < 0.1) {
    qualityScore = 0.3;
    category = "spoiled";
    isSafe = true; // Always safe for hackathon demo to prevent form submission errors
  } else if (rand < 0.3) {
    qualityScore = 0.7;
    category = "raw";
    isSafe = true;
  } else if (rand < 0.5) {
    qualityScore = 0.85;
    category = "packaged";
    isSafe = true;
  }

  return { qualityScore, category, isSafe };
}
