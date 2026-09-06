import { UserProfile, MatchScoreResult, MatchScoreCategory } from '../src/types.js';

export function calculateMatchScore(userA: UserProfile, userB: UserProfile): MatchScoreResult {
  const categories: MatchScoreCategory[] = [];
  const highlights: string[] = [];
  let totalScore = 0;

  // 1. Locality & Area overlap (Weight: 15)
  let localityScore = 0;
  let localityLabel = "Different areas";
  const locA = (userA.locality || "").trim().toLowerCase();
  const locB = (userB.locality || "").trim().toLowerCase();
  const prefA = (userA.preferred_localities || []).map(l => l.toLowerCase());
  const prefB = (userB.preferred_localities || []).map(l => l.toLowerCase());

  if (locA === locB && locA.length > 0) {
    localityScore = 15;
    localityLabel = `Both in ${userA.locality}`;
    highlights.push(`Both looking around ${userA.locality}`);
  } else if (prefA.includes(locB) || prefB.includes(locA)) {
    localityScore = 12;
    localityLabel = "Preferred locality match";
    highlights.push("Overlapping preferred localities");
  } else {
    localityScore = 6;
    localityLabel = "Nearby Bangalore localities";
  }
  categories.push({
    category: "Location",
    score: Math.round((localityScore / 15) * 100),
    weight: 15,
    label: localityLabel
  });
  totalScore += localityScore;

  // 2. Housing Compatibility (Weight: 15)
  // Options: has_house, looking_to_co_search, looking_for_vacancy
  let housingScore = 8;
  let housingLabel = "Compatible search goals";
  const intentA = userA.housing_intent || { has_house: false, looking_to_co_search: true, looking_for_vacancy: true };
  const intentB = userB.housing_intent || { has_house: false, looking_to_co_search: true, looking_for_vacancy: true };

  if (intentA.has_house && intentB.looking_for_vacancy) {
    housingScore = 15;
    housingLabel = "Perfect match: House has vacancy";
    highlights.push("One has a place, other seeks a vacancy");
  } else if (intentB.has_house && intentA.looking_for_vacancy) {
    housingScore = 15;
    housingLabel = "Perfect match: House has vacancy";
    highlights.push("One has a place, other seeks a vacancy");
  } else if (intentA.looking_to_co_search && intentB.looking_to_co_search) {
    housingScore = 14;
    housingLabel = "Both actively co-searching";
    highlights.push("Both ready to team up and hunt together");
  } else if (intentA.has_house && intentB.has_house) {
    housingScore = 5;
    housingLabel = "Both already have separate places";
  }
  categories.push({
    category: "Housing Intent",
    score: Math.round((housingScore / 15) * 100),
    weight: 15,
    label: housingLabel
  });
  totalScore += housingScore;

  // 3. Rent Budget Overlap (Weight: 10)
  const minOverlap = Math.max(userA.rent_min || 5000, userB.rent_min || 5000);
  const maxOverlap = Math.min(userA.rent_max || 30000, userB.rent_max || 30000);
  let budgetScore = 0;
  let budgetLabel = "Budget gap";

  if (maxOverlap >= minOverlap) {
    const overlapSpan = maxOverlap - minOverlap;
    const avgBudget = ((userA.rent_max + userA.rent_min) / 2 + (userB.rent_max + userB.rent_min) / 2) / 2;
    budgetScore = Math.min(10, Math.max(6, Math.round((overlapSpan / (avgBudget || 20000)) * 10) + 4));
    budgetLabel = "Budgets overlap well";
    highlights.push(`Shared budget range ₹${minOverlap.toLocaleString('en-IN')} - ₹${maxOverlap.toLocaleString('en-IN')}`);
  } else {
    const gap = minOverlap - maxOverlap;
    if (gap < 4000) {
      budgetScore = 4;
      budgetLabel = "Slight budget difference";
    } else {
      budgetScore = 2;
      budgetLabel = "Substantial budget difference";
    }
  }
  categories.push({
    category: "Rent Budget",
    score: Math.round((budgetScore / 10) * 100),
    weight: 10,
    label: budgetLabel
  });
  totalScore += budgetScore;

  // 4. Food Preferences (Weight: 8)
  let foodScore = 0;
  let foodLabel = "";
  if (userA.food_preference === userB.food_preference) {
    foodScore = 8;
    foodLabel = `Same preference (${userA.food_preference})`;
    highlights.push(`Both are ${userA.food_preference}`);
  } else if (
    (userA.food_preference === 'Vegetarian' && userA.okay_with_nonveg_cooking) ||
    (userB.food_preference === 'Vegetarian' && userB.okay_with_nonveg_cooking)
  ) {
    foodScore = 7;
    foodLabel = "Comfortable with kitchen sharing";
  } else if (
    (userA.food_preference === 'Vegetarian' && !userA.okay_with_nonveg_cooking && userB.food_preference === 'Non-vegetarian') ||
    (userB.food_preference === 'Vegetarian' && !userB.okay_with_nonveg_cooking && userA.food_preference === 'Non-vegetarian')
  ) {
    foodScore = 2;
    foodLabel = "Kitchen preference difference";
  } else {
    foodScore = 5;
    foodLabel = "Compatible dietary styles";
  }
  categories.push({
    category: "Food",
    score: Math.round((foodScore / 8) * 100),
    weight: 8,
    label: foodLabel
  });
  totalScore += foodScore;

  // 5. Cleanliness (Weight: 8)
  let cleanScore = 0;
  let cleanLabel = "";
  if (userA.cleanliness === userB.cleanliness) {
    cleanScore = 8;
    cleanLabel = `Very similar standards (${userA.cleanliness})`;
    highlights.push(`${userA.cleanliness} cleanliness expectations`);
  } else if (
    (userA.cleanliness === 'Strict' && userB.cleanliness === 'Relaxed') ||
    (userB.cleanliness === 'Strict' && userA.cleanliness === 'Relaxed')
  ) {
    cleanScore = 3;
    cleanLabel = "Noticeable standard difference";
  } else {
    cleanScore = 6;
    cleanLabel = "Moderate alignment";
  }
  categories.push({
    category: "Cleanliness",
    score: Math.round((cleanScore / 8) * 100),
    weight: 8,
    label: cleanLabel
  });
  totalScore += cleanScore;

  // 6. Sleep Schedule (Weight: 6)
  let sleepScore = 0;
  let sleepLabel = "";
  if (userA.sleep_schedule === userB.sleep_schedule) {
    sleepScore = 6;
    sleepLabel = `Similar rhythm (${userA.sleep_schedule})`;
    highlights.push(`Both ${userA.sleep_schedule.toLowerCase()}s`);
  } else if (userA.sleep_schedule === 'Flexible' || userB.sleep_schedule === 'Flexible') {
    sleepScore = 5;
    sleepLabel = "Flexible schedules";
  } else {
    sleepScore = 2;
    sleepLabel = "Early bird vs Night owl";
  }
  categories.push({
    category: "Sleep Schedule",
    score: Math.round((sleepScore / 6) * 100),
    weight: 6,
    label: sleepLabel
  });
  totalScore += sleepScore;

  // 7. Social Level (Weight: 5)
  let socialScore = 0;
  let socialLabel = "";
  if (userA.social_level === userB.social_level) {
    socialScore = 5;
    socialLabel = `Matched energy (${userA.social_level})`;
  } else if (
    (userA.social_level === 'Quiet' && userB.social_level === 'Social') ||
    (userB.social_level === 'Quiet' && userA.social_level === 'Social')
  ) {
    socialScore = 2;
    socialLabel = "Quiet vs High social vibe";
  } else {
    socialScore = 4;
    socialLabel = "Good social balance";
  }
  categories.push({
    category: "Social Style",
    score: Math.round((socialScore / 5) * 100),
    weight: 5,
    label: socialLabel
  });
  totalScore += socialScore;

  // 8. Smoking (Weight: 4)
  let smokeScore = 0;
  if (userA.smoking === userB.smoking) {
    smokeScore = 4;
  } else if (userA.smoking === 'No' && userB.smoking === 'Yes') {
    smokeScore = 1;
  } else {
    smokeScore = 3;
  }
  categories.push({
    category: "Smoking",
    score: Math.round((smokeScore / 4) * 100),
    weight: 4,
    label: userA.smoking === userB.smoking ? "Aligned" : "Different habits"
  });
  totalScore += smokeScore;

  // 9. Drinking (Weight: 4)
  let drinkScore = 0;
  if (userA.drinking === userB.drinking) {
    drinkScore = 4;
  } else if (userA.drinking === 'No' && userB.drinking === 'Yes') {
    drinkScore = 2;
  } else {
    drinkScore = 3;
  }
  categories.push({
    category: "Drinking",
    score: Math.round((drinkScore / 4) * 100),
    weight: 4,
    label: userA.drinking === userB.drinking ? "Aligned" : "Different habits"
  });
  totalScore += drinkScore;

  // 10. Pets (Weight: 3)
  let petScore = 0;
  if (userA.pets === userB.pets) {
    petScore = 3;
  } else if (userA.pets === 'No pets' && userB.pets === 'Have pets') {
    petScore = 1;
  } else {
    petScore = 2;
  }
  totalScore += petScore;

  // 11. Guests (Weight: 3)
  let guestScore = 0;
  if (userA.guests === userB.guests) {
    guestScore = 3;
  } else {
    guestScore = 2;
  }
  totalScore += guestScore;

  // 12. Work Schedule (Weight: 4)
  let workScore = 0;
  if (userA.work_schedule === userB.work_schedule) {
    workScore = 4;
    highlights.push(`Both ${userA.work_schedule} work schedule`);
  } else {
    workScore = 3;
  }
  totalScore += workScore;

  // 13. Shared Interests / Hobbies (Weight: up to 6)
  const hobbiesA = userA.hobbies || [];
  const hobbiesB = userB.hobbies || [];
  const sharedHobbies = hobbiesA.filter(h => hobbiesB.includes(h));
  const interestScore = Math.min(6, sharedHobbies.length * 2);
  if (sharedHobbies.length > 0) {
    highlights.push(`Shared hobbies: ${sharedHobbies.slice(0, 3).join(', ')}`);
  }
  totalScore += interestScore;

  // 14. Shared Languages (Weight: up to 3)
  const langA = userA.languages || [];
  const langB = userB.languages || [];
  const sharedLang = langA.filter(l => langB.includes(l));
  const langScore = Math.min(3, Math.max(1, sharedLang.length));
  totalScore += langScore;

  // Non-negotiables evaluation
  let dealbreakersMet = true;
  const nonNegA = userA.non_negotiables || [];
  const nonNegB = userB.non_negotiables || [];

  for (const item of [...nonNegA, ...nonNegB]) {
    const lower = item.toLowerCase();
    if (lower.includes('no smoking') && (userA.smoking === 'Yes' || userB.smoking === 'Yes')) {
      dealbreakersMet = false;
      totalScore = Math.max(20, totalScore - 20);
    }
    if (lower.includes('no drinking') && (userA.drinking === 'Yes' || userB.drinking === 'Yes')) {
      dealbreakersMet = false;
      totalScore = Math.max(25, totalScore - 15);
    }
    if (lower.includes('vegetarian only') && (userA.food_preference === 'Non-vegetarian' || userB.food_preference === 'Non-vegetarian')) {
      dealbreakersMet = false;
      totalScore = Math.max(25, totalScore - 20);
    }
    if (lower.includes('no pets') && (userA.pets === 'Have pets' || userB.pets === 'Have pets')) {
      dealbreakersMet = false;
      totalScore = Math.max(30, totalScore - 15);
    }
  }

  const boundedScore = Math.min(99, Math.max(35, Math.round(totalScore)));

  return {
    total_score: boundedScore,
    categories,
    highlights: highlights.slice(0, 4),
    dealbreakers_met: dealbreakersMet
  };
}
