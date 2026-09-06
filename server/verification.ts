import { GoogleGenAI, Type } from '@google/genai';

export type LivenessChallenge = 'thumbs_up' | 'thumbs_down' | 'peace' | 'open_hand';

export interface LivenessVerificationResult {
  passed: boolean;
  is_live: boolean;
  has_peace_sign: boolean;
  is_face_clear: boolean;
  has_gesture: boolean;
  challenge: LivenessChallenge;
  confidence: number;
  message: string;
}

export interface FaceMatchVerificationResult {
  passed: boolean;
  similarity_percentage: number;
  is_same_person: boolean;
  is_ai_generated: boolean;
  confidence: number;
  feedback: string;
}

export interface VerificationResult {
  verified: boolean;
  confidence: number;
  message?: string;
  isAiGeneratedWarning?: boolean;
}

let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  return aiClient;
}

const CHALLENGE_LABELS: Record<LivenessChallenge, string> = {
  thumbs_up: 'thumbs up 👍',
  thumbs_down: 'thumbs down 👎',
  peace: 'peace sign ✌️',
  open_hand: 'open hand / five fingers ✋'
};

function extractChallenge(data: string): { base64: string; mimeType: string; challenge: LivenessChallenge } {
  const fallback: LivenessChallenge = 'peace';
  if (!data?.startsWith('data:')) return { base64: data || '', mimeType: 'image/jpeg', challenge: fallback };
  const match = data.match(/^data:([^;]+)(?:;challenge=([a-z_]+))?;base64,(.+)$/);
  if (!match) return { base64: data, mimeType: 'image/jpeg', challenge: fallback };
  const candidate = match[2] as LivenessChallenge | undefined;
  const challenge = candidate && candidate in CHALLENGE_LABELS ? candidate : fallback;
  return { mimeType: match[1], challenge, base64: match[3] };
}

/** AI liveness check using a randomly assigned one-hand gesture. */
export async function verifyPeaceSignLiveness(base64Data: string): Promise<LivenessVerificationResult> {
  const { base64, mimeType, challenge } = extractChallenge(base64Data);
  if (!base64 || base64.length < 1000) return { passed: false, is_live: false, has_peace_sign: false, is_face_clear: false, has_gesture: false, challenge, confidence: 0, message: 'Photo capture is missing or incomplete. Please take a clear photo.' };

  const ai = getAiClient();
  if (!ai) return { passed: false, is_live: false, has_peace_sign: false, is_face_clear: false, has_gesture: false, challenge, confidence: 0, message: 'Liveness verification is temporarily unavailable. Please try again.' };

  try {
    const gesture = CHALLENGE_LABELS[challenge];
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: `You are a strict biometric liveness verifier for FlatMate+. The assigned challenge is: ${gesture}. Analyze this camera photo. Verify: (1) authentic photograph of a real living person, not a screen, print, avatar, render or AI image; (2) exactly the assigned one-hand gesture ${gesture} is clearly visible; (3) the face is clearly visible. The hand gesture must be made with one hand. For thumbs up/down, verify the thumb direction. For peace, verify two raised fingers. For open hand, verify five visibly extended fingers. Do not accept a different gesture. Return JSON only.` }
      ] },
      config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: {
        is_live: { type: Type.BOOLEAN }, has_gesture: { type: Type.BOOLEAN }, has_peace_sign: { type: Type.BOOLEAN }, is_face_clear: { type: Type.BOOLEAN }, passed: { type: Type.BOOLEAN }, confidence: { type: Type.NUMBER }, message: { type: Type.STRING }
      }, required: ['is_live','has_gesture','has_peace_sign','is_face_clear','passed','confidence','message'] } }
    });
    const parsed = JSON.parse(response.text?.trim() || '{}');
    const passed = Boolean(parsed.is_live) && Boolean(parsed.has_gesture) && Boolean(parsed.is_face_clear);
    return {
      passed,
      is_live: Boolean(parsed.is_live),
      has_peace_sign: Boolean(parsed.has_peace_sign),
      is_face_clear: Boolean(parsed.is_face_clear),
      has_gesture: Boolean(parsed.has_gesture),
      challenge,
      confidence: Number(parsed.confidence) || (passed ? 95 : 40),
      message: parsed.message || (passed ? `Liveness verified with ${gesture}.` : `Please make the requested ${gesture} clearly with one hand and keep your face visible.`)
    };
  } catch (err: any) {
    console.warn('Gemini liveness check failed:', err?.message || err);
    return { passed: false, is_live: false, has_peace_sign: false, is_face_clear: false, has_gesture: false, challenge, confidence: 0, message: 'We could not complete the liveness check. Please try again.' };
  }
}

export async function verifyFaceMatchAgainstLive(livePhotoBase64: string, profilePhotoBase64: string, mimeType: string = 'image/jpeg'): Promise<FaceMatchVerificationResult> {
  const live = extractChallenge(livePhotoBase64);
  const profile = extractChallenge(profilePhotoBase64);
  if (!profile.base64 || profile.base64.length < 1000) return { passed:false, similarity_percentage:0, is_same_person:false, is_ai_generated:false, confidence:0, feedback:'Please select a clear photo to upload.' };
  const ai = getAiClient();
  if (ai && live.base64) {
    try {
      const response = await ai.models.generateContent({ model:'gemini-3.7-flash', contents:{parts:[
        {inlineData:{mimeType:live.mimeType,data:live.base64}}, {inlineData:{mimeType:profile.mimeType,data:profile.base64}},
        {text:`You are an identity verification and anti-fraud system for FlatMate+. Image 1 is the user's verified live camera photo. Image 2 is the profile photo. Compare facial structure and estimate resemblance 0-100. Inspect Image 2 for AI/synthetic generation. Pass only when resemblance >=65 and the profile photo is not AI-generated. Return JSON only.`}
      ]}, config:{responseMimeType:'application/json',responseSchema:{type:Type.OBJECT,properties:{similarity_percentage:{type:Type.NUMBER},is_same_person:{type:Type.BOOLEAN},is_ai_generated:{type:Type.BOOLEAN},passed:{type:Type.BOOLEAN},confidence:{type:Type.NUMBER},feedback:{type:Type.STRING}},required:['similarity_percentage','is_same_person','is_ai_generated','passed','confidence','feedback']}}});
      const parsed=JSON.parse(response.text?.trim()||'{}'); const sim=Math.min(100,Math.max(0,Math.round(parsed.similarity_percentage??0))); const isAi=Boolean(parsed.is_ai_generated); const passed=sim>=65&&!isAi;
      return {passed,similarity_percentage:sim,is_same_person:Boolean(parsed.is_same_person),is_ai_generated:isAi,confidence:Number(parsed.confidence)||90,feedback:parsed.feedback|| (isAi?'AI-generated or synthetic photos are not permitted. Please upload a genuine photo.':passed?'Photo verified successfully.':'Photo does not clearly match your live photo. Please upload a clearer photo.')};
    } catch (err:any) { console.warn('Gemini face match check failed:',err?.message||err); }
  }
  return {passed:false,similarity_percentage:0,is_same_person:false,is_ai_generated:false,confidence:0,feedback:'Photo verification is temporarily unavailable. Please try again.'};
}

export function verifyPhotoUpload(base64Data: string, mimeType: string): VerificationResult {
  if (!base64Data) return {verified:false,confidence:0,message:'Please select or take a photo to upload.'};
  const validMimes=['image/jpeg','image/jpg','image/png','image/webp']; const normalized=(mimeType||'').toLowerCase();
  if (normalized && !validMimes.some(m=>normalized.includes(m.split('/')[1]))) return {verified:false,confidence:0,message:'Unsupported file type. Please upload a JPG, PNG, or WEBP photo.'};
  const comma=base64Data.indexOf(','); const stringLength=comma>=0?base64Data.length-comma-1:base64Data.length; const sizeInBytes=(stringLength*3)/4;
  if(sizeInBytes>8*1024*1024) return {verified:false,confidence:0,message:'Photo exceeds the maximum size of 8MB. Please upload a smaller image.'};
  if(sizeInBytes<1000) return {verified:false,confidence:0,message:'Image file appears incomplete or damaged. Please select a clear photo.'};
  return {verified:true,confidence:95,message:'Photo verified successfully.'};
}
