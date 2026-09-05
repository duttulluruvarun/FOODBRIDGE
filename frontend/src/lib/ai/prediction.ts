/**
 * Predicts remaining shelf life in hours based on food type and temperature.
 */
export function predictShelfLife(foodType: string, temperature: string): number {
  let baseLifeHours = 24;

  if (foodType.toLowerCase() === 'veg') {
    baseLifeHours += 12;
  } else {
    // non-veg expires faster
    baseLifeHours -= 6;
  }

  switch(temperature.toLowerCase()) {
    case 'frozen':
      baseLifeHours *= 5; // 5 times longer
      break;
    case 'cold':
      baseLifeHours *= 2;
      break;
    case 'hot':
      baseLifeHours *= 0.5;
      break;
    case 'room':
    default:
      // no change
      break;
  }

  return baseLifeHours;
}
