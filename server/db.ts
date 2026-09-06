import { AuthUser, UserProfile, DiscoverFilters, MatchItem, MessageItem, BlockRecord, UserSettings } from '../src/types.js';
import { calculateMatchScore } from './scoring.js';

// In-memory collections
export const users: Map<string, { id: string; email: string; phone: string; password_hash: string; phone_verified: boolean; email_verified: boolean; google_id?: string; created_at: string }> = new Map();
export const profiles: Map<string, UserProfile> = new Map();
export const swipes: Map<string, { id: string; user_id: string; target_user_id: string; action: 'like' | 'pass'; created_at: string }> = new Map();
export const matches: Map<string, MatchItem> = new Map();
export const messages: Map<string, MessageItem> = new Map();
export const blocks: Map<string, BlockRecord> = new Map();
export const reports: Map<string, { id: string; reporter_id: string; reported_id: string; reason: string; details?: string; created_at: string }> = new Map();
export const settingsStore: Map<string, UserSettings> = new Map();

// Seed Profiles for Bangalore (12 diverse, human, detailed profiles)
export function seedBangaloreProfiles() {
  if (profiles.size > 2) return; // Already seeded

  const seedData: Array<Partial<UserProfile> & { email: string; phone: string }> = [
    {
      email: 'ananya.sharma@example.com',
      phone: '+919845012345',
      name: 'Ananya Sharma',
      date_of_birth: '1999-04-14',
      age: 27,
      gender: 'Woman',
      flatmate_gender_preference: 'Women only',
      city: 'Bangalore',
      locality: 'Indiranagar',
      preferred_localities: ['Indiranagar', 'Koramangala', 'Domlur'],
      housing_intent: {
        has_house: true,
        looking_to_co_search: false,
        looking_for_vacancy: false
      },
      house_details: {
        bhk: '3 BHK',
        total_washrooms: 3,
        attached_washroom_in_vacant_room: true,
        balcony_type: 'Attached to vacant room',
        vacant_room_amenities: ['Bed & Mattress', 'Wardrobe', 'Air Conditioner (AC)', 'Study Desk', 'Geyser', 'WiFi', 'Power Backup', 'Maid / Cook available'],
        rent_for_vacant_room: 20000,
        deposit_amount: 50000,
        house_photos: [
          { id: 'hp1', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80', is_main: true, caption: 'Spacious Sunlit Living Room' },
          { id: 'hp2', url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80', is_main: false, caption: 'Vacant Bedroom with Balcony' },
          { id: 'hp3', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80', is_main: false, caption: 'Modular Kitchen with chimney' }
        ]
      },
      rent_min: 16000,
      rent_max: 24000,
      food_preference: 'Vegetarian',
      okay_with_nonveg_cooking: true,
      smoking: 'No',
      drinking: 'Occasionally',
      cleanliness: 'Strict',
      sleep_schedule: 'Flexible',
      social_level: 'Balanced',
      guests: 'Weekends only',
      family_visits: 'Rarely',
      parties: 'Occasionally',
      pets: 'Pet lover / Open to pets',
      work_schedule: 'Hybrid',
      attached_washroom: 'Must have',
      furnishing: 'Fully furnished',
      gated_society: true,
      hobbies: ['Cooking', 'Yoga', 'Reading', 'Startups', 'Coffee brewing'],
      languages: ['English', 'Hindi', 'Kannada'],
      non_negotiables: ['No smoking indoors', 'Clean kitchen habits'],
      bio: 'Product designer at a fintech startup. I have a spacious 3BHK in Indiranagar 100ft road with 1 master room vacant! Looking for a chill, responsible flatmate who enjoys good filter coffee and occasional weekend board games.',
      prompts: [
        { question: "My non-negotiable house rule", answer: "Clean dishes immediately after cooking and respectful noise levels past 11 PM." },
        { question: "A typical Sunday looks like", answer: "Brewing specialty coffee, plant care on the balcony, and reading fiction." }
      ],
      photos: [
        { id: 'p1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80', is_main: true },
        { id: 'p1_2', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80', is_main: false, caption: 'Our sunlit living room' }
      ],
      is_verified: true,
      liveness_verified: true,
      verification_status: 'verified',
      onboarding_step: 100,
      is_profile_complete: true,
      discover_active: true,
      moved_in_status: 'none'
    },
    {
      email: 'rohan.mehta@example.com',
      phone: '+919886023456',
      name: 'Rohan Mehta',
      date_of_birth: '1998-08-22',
      age: 28,
      gender: 'Man',
      flatmate_gender_preference: 'Any',
      city: 'Bangalore',
      locality: 'Koramangala',
      preferred_localities: ['Koramangala', 'HSR Layout', 'Indiranagar'],
      housing_intent: {
        has_house: false,
        looking_to_co_search: true,
        looking_for_vacancy: true
      },
      rent_min: 14000,
      rent_max: 22000,
      food_preference: 'Non-vegetarian',
      okay_with_nonveg_cooking: true,
      smoking: 'No',
      drinking: 'Occasionally',
      cleanliness: 'Strict',
      sleep_schedule: 'Night owl',
      social_level: 'Social',
      guests: 'Anytime with notice',
      family_visits: 'Rarely',
      parties: 'Occasionally',
      pets: 'Have pets',
      work_schedule: 'WFH',
      attached_washroom: 'Must have',
      furnishing: 'Semi-furnished',
      gated_society: true,
      hobbies: ['Fitness', 'Tech', 'Startups', 'Gaming', 'Hiking'],
      languages: ['English', 'Hindi', 'Gujarati'],
      non_negotiables: ['No smoking', 'Pet friendly flatmate'],
      bio: 'Software engineer & indie hacker. I have an adorable golden retriever named Milo. Looking for someone who is pet-friendly, keeps common spaces tidy, and loves tech conversations over evening chai.',
      prompts: [
        { question: "Housemate green flag", answer: "Clear communication, sharing groceries fairly, and giving Milo ear scratches." },
        { question: "My biggest quirk", answer: "I build mechanical keyboards and have 4 monitors on my standing desk." }
      ],
      photos: [
        { id: 'p2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80', is_main: true },
        { id: 'p2_2', url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop&q=80', is_main: false, caption: 'Milo the roommate co-founder' }
      ],
      is_verified: true,
      liveness_verified: true,
      verification_status: 'verified',
      onboarding_step: 100,
      is_profile_complete: true,
      discover_active: true,
      moved_in_status: 'none'
    },
    {
      email: 'priya.nair@example.com',
      phone: '+919876534567',
      name: 'Priya Nair',
      date_of_birth: '2000-11-05',
      age: 25,
      gender: 'Woman',
      flatmate_gender_preference: 'Women only',
      city: 'Bangalore',
      locality: 'HSR Layout',
      preferred_localities: ['HSR Layout', 'Bellandur', 'Koramangala'],
      housing_intent: {
        has_house: false,
        looking_to_co_search: true,
        looking_for_vacancy: true
      },
      rent_min: 12000,
      rent_max: 20000,
      food_preference: 'Vegetarian',
      okay_with_nonveg_cooking: true,
      smoking: 'No',
      drinking: 'No',
      cleanliness: 'Strict',
      sleep_schedule: 'Early bird',
      social_level: 'Balanced',
      guests: 'Rarely',
      family_visits: 'Occasionally',
      parties: 'Never at home',
      pets: 'No pets',
      work_schedule: 'Hybrid',
      attached_washroom: 'Must have',
      furnishing: 'Fully furnished',
      gated_society: true,
      hobbies: ['Art', 'Yoga', 'Reading', 'Music', 'Travel'],
      languages: ['English', 'Malayalam', 'Hindi', 'Kannada'],
      non_negotiables: ['No smoking', 'Quiet hours after 10:30 PM'],
      bio: 'Brand strategist at an agency. Early riser who loves morning yoga and calm evenings. Looking for a quiet, organized space with another working woman who values peaceful home vibes.',
      prompts: [
        { question: "My ideal home vibe", answer: "Warm lights, clean floors, aromatic diffuser, and zero drama." },
        { question: "Best way to resolve roommate issues", answer: "Honest 5-minute conversation over evening ginger tea." }
      ],
      photos: [
        { id: 'p3', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80', is_main: true }
      ],
      is_verified: true,
      liveness_verified: true,
      verification_status: 'verified',
      onboarding_step: 100,
      is_profile_complete: true,
      discover_active: true,
      moved_in_status: 'none'
    },
    {
      email: 'aravind.k@example.com',
      phone: '+919844045678',
      name: 'Aravind Krishnan',
      date_of_birth: '1997-02-18',
      age: 29,
      gender: 'Man',
      flatmate_gender_preference: 'Men only',
      city: 'Bangalore',
      locality: 'Bellandur',
      preferred_localities: ['Bellandur', 'Marathahalli', 'HSR Layout'],
      housing_intent: {
        has_house: true,
        looking_to_co_search: false,
        looking_for_vacancy: false
      },
      house_details: {
        bhk: '2 BHK',
        total_washrooms: 2,
        attached_washroom_in_vacant_room: true,
        balcony_type: 'Common balcony',
        vacant_room_amenities: ['Bed & Mattress', 'Wardrobe', 'Study Desk', 'WiFi', 'Power Backup', 'Maid / Cook available', 'Washing Machine', 'Refrigerator'],
        rent_for_vacant_room: 18500,
        deposit_amount: 45000,
        house_photos: [
          { id: 'hp4_1', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80', is_main: true, caption: 'Modern gated society flat' },
          { id: 'hp4_2', url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80', is_main: false, caption: 'Spacious furnished bedroom' }
        ]
      },
      rent_min: 15000,
      rent_max: 22000,
      food_preference: 'Non-vegetarian',
      okay_with_nonveg_cooking: true,
      smoking: 'No',
      drinking: 'Occasionally',
      cleanliness: 'Moderate',
      sleep_schedule: 'Flexible',
      social_level: 'Balanced',
      guests: 'Weekends only',
      family_visits: 'Rarely',
      parties: 'Occasionally',
      pets: 'Pet lover / Open to pets',
      work_schedule: 'Office / In-person',
      attached_washroom: 'Must have',
      furnishing: 'Fully furnished',
      gated_society: true,
      hobbies: ['Fitness', 'Food', 'Travel', 'Movies', 'Tech'],
      languages: ['English', 'Tamil', 'Hindi', 'Kannada'],
      non_negotiables: ['No smoking indoors'],
      bio: 'Data scientist working in Bellandur EcoSpace. Have a 2BHK in a premium gated society with gym & pool. Looking for a flatmate for the second bedroom with attached bath.',
      prompts: [
        { question: "House perks", answer: "High-speed 300 Mbps wifi, daily cook already hired, 5 mins walk to tech park." }
      ],
      photos: [
        { id: 'p4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80', is_main: true }
      ],
      is_verified: true,
      liveness_verified: true,
      verification_status: 'verified',
      onboarding_step: 100,
      is_profile_complete: true,
      discover_active: true,
      moved_in_status: 'none'
    },
    {
      email: 'tanvi.patel@example.com',
      phone: '+919825056789',
      name: 'Tanvi Patel',
      date_of_birth: '2001-07-30',
      age: 25,
      gender: 'Woman',
      flatmate_gender_preference: 'Any',
      city: 'Bangalore',
      locality: 'Whitefield',
      preferred_localities: ['Whitefield', 'Hennur', 'Indiranagar'],
      housing_intent: {
        has_house: false,
        looking_to_co_search: true,
        looking_for_vacancy: true
      },
      rent_min: 10000,
      rent_max: 18000,
      food_preference: 'Vegetarian',
      okay_with_nonveg_cooking: false,
      smoking: 'No',
      drinking: 'No',
      cleanliness: 'Strict',
      sleep_schedule: 'Flexible',
      social_level: 'Quiet',
      guests: 'Rarely',
      family_visits: 'Occasionally',
      parties: 'Never at home',
      pets: 'No pets',
      work_schedule: 'WFH',
      attached_washroom: 'Nice to have',
      furnishing: 'Fully furnished',
      gated_society: true,
      hobbies: ['Art', 'Cooking', 'Reading', 'Yoga'],
      languages: ['English', 'Gujarati', 'Hindi'],
      non_negotiables: ['Vegetarian only kitchen', 'No smoking'],
      bio: 'UX researcher working remotely. Looking for a pure vegetarian apartment with calm vibes and plenty of natural sunlight in Whitefield or nearby.',
      prompts: [
        { question: "House essential", answer: "Pure vegetarian kitchen and lots of indoor greenery." }
      ],
      photos: [
        { id: 'p5', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80', is_main: true }
      ],
      is_verified: true,
      liveness_verified: true,
      verification_status: 'verified',
      onboarding_step: 100,
      is_profile_complete: true,
      discover_active: true,
      moved_in_status: 'none'
    },
    {
      email: 'vikram.sen@example.com',
      phone: '+919833067890',
      name: 'Vikram Sengupta',
      date_of_birth: '1996-09-12',
      age: 30,
      gender: 'Man',
      flatmate_gender_preference: 'Any',
      city: 'Bangalore',
      locality: 'Hennur',
      preferred_localities: ['Hennur', 'Hebbal', 'Yelahanka'],
      housing_intent: {
        has_house: true,
        looking_to_co_search: false,
        looking_for_vacancy: false
      },
      rent_min: 12000,
      rent_max: 18000,
      food_preference: 'Non-vegetarian',
      okay_with_nonveg_cooking: true,
      smoking: 'Occasionally',
      drinking: 'Occasionally',
      cleanliness: 'Moderate',
      sleep_schedule: 'Night owl',
      social_level: 'Social',
      guests: 'Anytime with notice',
      family_visits: 'Rarely',
      parties: 'Occasionally',
      pets: 'Have pets',
      work_schedule: 'Hybrid',
      attached_washroom: 'Must have',
      furnishing: 'Semi-furnished',
      gated_society: true,
      hobbies: ['Music', 'Gaming', 'Cooking', 'Travel', 'Movies'],
      languages: ['English', 'Bengali', 'Hindi'],
      non_negotiables: ['Pet friendly'],
      bio: 'Music producer & sound architect. Have a calm independent villa floor in Hennur with open terrace and a friendly indie cat. Looking for a laid-back housemate.',
      prompts: [
        { question: "Best part of living here", answer: "Rooftop acoustic jam sessions and quiet North Bangalore sunsets." }
      ],
      photos: [
        { id: 'p6', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80', is_main: true }
      ],
      is_verified: true,
      liveness_verified: true,
      verification_status: 'verified',
      onboarding_step: 100,
      is_profile_complete: true,
      discover_active: true,
      moved_in_status: 'none'
    },
    {
      email: 'neha.reddy@example.com',
      phone: '+919848078901',
      name: 'Neha Reddy',
      date_of_birth: '1999-12-04',
      age: 26,
      gender: 'Woman',
      flatmate_gender_preference: 'Women only',
      city: 'Bangalore',
      locality: 'Koramangala',
      preferred_localities: ['Koramangala', 'Indiranagar', 'BTM Layout'],
      housing_intent: {
        has_house: false,
        looking_to_co_search: true,
        looking_for_vacancy: true
      },
      rent_min: 15000,
      rent_max: 25000,
      food_preference: 'Non-vegetarian',
      okay_with_nonveg_cooking: true,
      smoking: 'No',
      drinking: 'Occasionally',
      cleanliness: 'Strict',
      sleep_schedule: 'Flexible',
      social_level: 'Social',
      guests: 'Weekends only',
      family_visits: 'Occasionally',
      parties: 'Occasionally',
      pets: 'Pet lover / Open to pets',
      work_schedule: 'Office / In-person',
      attached_washroom: 'Must have',
      furnishing: 'Fully furnished',
      gated_society: true,
      hobbies: ['Fitness', 'Travel', 'Startups', 'Food', 'Movies'],
      languages: ['English', 'Telugu', 'Hindi', 'Kannada'],
      non_negotiables: ['No smoking', 'Clean common spaces'],
      bio: 'Growth lead at an e-commerce firm. Passionate about strength training and finding the best biryani spots in Bangalore. Looking for an energetic flatmate in Koramangala.',
      prompts: [
        { question: "Sunday routine", answer: "Morning gym, brunch at a cozy cafe, grocery run for meal prep." }
      ],
      photos: [
        { id: 'p7', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80', is_main: true }
      ],
      is_verified: true,
      liveness_verified: true,
      verification_status: 'verified',
      onboarding_step: 100,
      is_profile_complete: true,
      discover_active: true,
      moved_in_status: 'none'
    },
    {
      email: 'karan.sharma@example.com',
      phone: '+919811089012',
      name: 'Karan Sharma',
      date_of_birth: '1995-03-21',
      age: 31,
      gender: 'Man',
      flatmate_gender_preference: 'Any',
      city: 'Bangalore',
      locality: 'Electronic City',
      preferred_localities: ['Electronic City', 'BTM Layout', 'HSR Layout'],
      housing_intent: {
        has_house: true,
        looking_to_co_search: false,
        looking_for_vacancy: false
      },
      rent_min: 8000,
      rent_max: 15000,
      food_preference: 'Eggetarian',
      okay_with_nonveg_cooking: true,
      smoking: 'No',
      drinking: 'No',
      cleanliness: 'Moderate',
      sleep_schedule: 'Early bird',
      social_level: 'Balanced',
      guests: 'Rarely',
      family_visits: 'Occasionally',
      parties: 'Never at home',
      pets: 'No pets',
      work_schedule: 'Hybrid',
      attached_washroom: 'Must have',
      furnishing: 'Fully furnished',
      gated_society: true,
      hobbies: ['Tech', 'Gaming', 'Hiking', 'Cooking'],
      languages: ['English', 'Hindi', 'Punjabi'],
      non_negotiables: ['No smoking', 'No drinking at home'],
      bio: 'Cloud Architect working in Phase 1. Have a quiet 2BHK flat near Wipro gate. Looking for a neat, easy-going roommate.',
      prompts: [
        { question: "House perk", answer: "Dedicated study room, power backup, and quiet tree-lined balcony." }
      ],
      photos: [
        { id: 'p8', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80', is_main: true }
      ],
      is_verified: true,
      liveness_verified: true,
      verification_status: 'verified',
      onboarding_step: 100,
      is_profile_complete: true,
      discover_active: true,
      moved_in_status: 'none'
    },
    {
      email: 'divya.menon@example.com',
      phone: '+919846090123',
      name: 'Divya Menon',
      date_of_birth: '1998-06-17',
      age: 28,
      gender: 'Woman',
      flatmate_gender_preference: 'Women only',
      city: 'Bangalore',
      locality: 'JP Nagar',
      preferred_localities: ['JP Nagar', 'BTM Layout', 'Jayanagar'],
      housing_intent: {
        has_house: false,
        looking_to_co_search: true,
        looking_for_vacancy: true
      },
      rent_min: 11000,
      rent_max: 19000,
      food_preference: 'Vegetarian',
      okay_with_nonveg_cooking: true,
      smoking: 'No',
      drinking: 'Occasionally',
      cleanliness: 'Strict',
      sleep_schedule: 'Early bird',
      social_level: 'Balanced',
      guests: 'Weekends only',
      family_visits: 'Rarely',
      parties: 'Occasionally',
      pets: 'Pet lover / Open to pets',
      work_schedule: 'Hybrid',
      attached_washroom: 'Must have',
      furnishing: 'Semi-furnished',
      gated_society: true,
      hobbies: ['Yoga', 'Reading', 'Art', 'Travel', 'Coffee brewing'],
      languages: ['English', 'Malayalam', 'Hindi', 'Tamil'],
      non_negotiables: ['No smoking indoors'],
      bio: 'Content strategist & bibliophile. Looking for a sunny apartment in South Bangalore with a calm, friendly flatmate.',
      prompts: [
        { question: "Essential morning routine", answer: "South Indian filter coffee, 20 mins journaling, fresh sunlight." }
      ],
      photos: [
        { id: 'p9', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80', is_main: true }
      ],
      is_verified: true,
      liveness_verified: true,
      verification_status: 'verified',
      onboarding_step: 100,
      is_profile_complete: true,
      discover_active: true,
      moved_in_status: 'none'
    },
    {
      email: 'aditya.joshi@example.com',
      phone: '+919820011223',
      name: 'Aditya Joshi',
      date_of_birth: '1997-10-10',
      age: 28,
      gender: 'Man',
      flatmate_gender_preference: 'Any',
      city: 'Bangalore',
      locality: 'Hebbal',
      preferred_localities: ['Hebbal', 'Yelahanka', 'Hennur'],
      housing_intent: {
        has_house: false,
        looking_to_co_search: true,
        looking_for_vacancy: true
      },
      rent_min: 13000,
      rent_max: 20000,
      food_preference: 'Non-vegetarian',
      okay_with_nonveg_cooking: true,
      smoking: 'No',
      drinking: 'Occasionally',
      cleanliness: 'Strict',
      sleep_schedule: 'Flexible',
      social_level: 'Balanced',
      guests: 'Anytime with notice',
      family_visits: 'Rarely',
      parties: 'Occasionally',
      pets: 'Pet lover / Open to pets',
      work_schedule: 'Hybrid',
      attached_washroom: 'Must have',
      furnishing: 'Fully furnished',
      gated_society: true,
      hobbies: ['Hiking', 'Startups', 'Tech', 'Cooking', 'Fitness'],
      languages: ['English', 'Marathi', 'Hindi'],
      non_negotiables: ['No smoking', 'Clean kitchen habits'],
      bio: 'Fintech product manager. Love weekend trekking in Western Ghats and whipping up Maharashtra-style curries on Sundays.',
      prompts: [
        { question: "Ideal flatmate quality", answer: "Emotional maturity, shared responsibility, and sense of humor." }
      ],
      photos: [
        { id: 'p10', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80', is_main: true }
      ],
      is_verified: true,
      liveness_verified: true,
      verification_status: 'verified',
      onboarding_step: 100,
      is_profile_complete: true,
      discover_active: true,
      moved_in_status: 'none'
    }
  ];

  seedData.forEach((item, index) => {
    const id = `user_seed_${index + 1}`;
    const userObj = {
      id,
      email: item.email,
      phone: item.phone,
      password_hash: 'seed_pass_hash',
      phone_verified: true,
      email_verified: true,
      created_at: new Date().toISOString()
    };
    users.set(id, userObj);

    const profileObj: UserProfile = {
      id: `profile_${id}`,
      user_id: id,
      name: item.name!,
      date_of_birth: item.date_of_birth!,
      age: item.age!,
      gender: item.gender!,
      flatmate_gender_preference: item.flatmate_gender_preference!,
      city: item.city!,
      locality: item.locality!,
      preferred_localities: item.preferred_localities || [item.locality!],
      housing_intent: item.housing_intent!,
      rent_min: item.rent_min!,
      rent_max: item.rent_max!,
      food_preference: item.food_preference!,
      okay_with_nonveg_cooking: item.okay_with_nonveg_cooking ?? true,
      smoking: item.smoking!,
      drinking: item.drinking!,
      cleanliness: item.cleanliness!,
      sleep_schedule: item.sleep_schedule!,
      social_level: item.social_level!,
      guests: item.guests!,
      family_visits: item.family_visits!,
      parties: item.parties!,
      pets: item.pets!,
      work_schedule: item.work_schedule!,
      attached_washroom: item.attached_washroom!,
      furnishing: item.furnishing!,
      gated_society: item.gated_society ?? true,
      hobbies: item.hobbies || [],
      languages: item.languages || ['English', 'Hindi'],
      non_negotiables: item.non_negotiables || [],
      bio: item.bio || '',
      prompts: item.prompts || [],
      photos: item.photos || [],
      main_photo: item.photos && item.photos[0] ? item.photos[0].url : '',
      is_verified: true,
      liveness_verified: true,
      verification_status: 'verified',
      onboarding_step: 100,
      is_profile_complete: true,
      discover_active: true,
      moved_in_status: 'none',
      created_at: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
      updated_at: new Date().toISOString()
    };

    profiles.set(id, profileObj);
  });
}

// Initial seed call
seedBangaloreProfiles();
