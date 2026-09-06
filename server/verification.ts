import { GoogleGenAI, Type } from '@google/genai';

export type LivenessChallenge = 'thumbs_up' | 'thumbs_down' | 'peace' | 'open_hand';
export interface LivenessVerificationResult { passed:boolean; is_live:boolean; has_peace_sign:boolean; is_face_clear:boolean; has_gesture:boolean; challenge:LivenessChallenge; confidence:number; message:string; }
export interface FaceMatchVerificationResult { passed:boolean; similarity_percentage:number; is_same_person:boolean; is_ai_generated:boolean; confidence:number; feedback:string; }
export interface VerificationResult { verified:boolean; confidence:number; message?:string; isAiGeneratedWarning?:boolean; }

let aiClient:GoogleGenAI|null=null;
function getAiClient(){
  if(!aiClient&&process.env.GEMINI_API_KEY){
    aiClient=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
  }
  return aiClient;
}

const LABELS:Record<LivenessChallenge,string>={
  thumbs_up:'thumbs up',
  thumbs_down:'thumbs down',
  peace:'peace sign (two fingers raised)',
  open_hand:'open hand (five fingers raised)'
};

function extractChallenge(data:string):{base64:string;mimeType:string;challenge:LivenessChallenge}{
  const fallback:LivenessChallenge='peace';
  if(!data?.startsWith('data:'))return{base64:data||'',mimeType:'image/jpeg',challenge:fallback};
  const m=data.match(/^data:([^;]+)(?:;challenge=([a-z_]+))?;base64,(.+)$/);
  if(!m)return{base64:data,mimeType:'image/jpeg',challenge:fallback};
  const c=m[2] as LivenessChallenge|undefined;
  return{base64:m[3],mimeType:m[1],challenge:c&&c in LABELS?c:fallback};
}

function parseJson(text:string):any{
  const cleaned=(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
  try{return JSON.parse(cleaned);}catch{
    const start=cleaned.indexOf('{');
    const end=cleaned.lastIndexOf('}');
    if(start>=0&&end>start){try{return JSON.parse(cleaned.slice(start,end+1));}catch{}}
    return {};
  }
}

async function generateVerification(ai:GoogleGenAI,base64:string,mimeType:string,challenge:LivenessChallenge){
  const gesture=LABELS[challenge];
  const models=['gemini-3.8-flash','gemini-3.7-flash','gemini-3.6-flash'];
  let lastError:any;
  for(const model of models){
    try{
      const response=await Promise.race([
        ai.models.generateContent({
          model,
          contents:{parts:[
            {inlineData:{mimeType,data:base64}},
            {text:`FlatMate+ selfie verification. The person was instructed to show ONE HAND doing exactly: ${gesture}. Look at the image carefully and return JSON only.\n\nPass requirements: a real person's face is clearly visible AND the requested hand gesture is clearly visible. The gesture must be the requested one, not a different gesture. A normal webcam/phone selfie, ordinary lighting, glasses, makeup, or a slightly imperfect crop are acceptable. Only mark is_live false for an obvious non-person image, screen/photo-of-photo, mannequin, cartoon/avatar, or clearly synthetic image. Do not fail merely because you cannot prove liveness beyond the single image.\n\nSet has_gesture true only when the requested gesture is clearly present. Set is_face_clear true when one face is visible and sufficiently clear. confidence is 0-100.`}
          ]},
          config:{
            responseMimeType:'application/json',
            responseSchema:{type:Type.OBJECT,properties:{
              is_live:{type:Type.BOOLEAN},
              has_gesture:{type:Type.BOOLEAN},
              has_peace_sign:{type:Type.BOOLEAN},
              is_face_clear:{type:Type.BOOLEAN},
              passed:{type:Type.BOOLEAN},
              confidence:{type:Type.NUMBER},
              message:{type:Type.STRING}
            },required:['is_live','has_gesture','has_peace_sign','is_face_clear','passed','confidence','message']},
            thinkingConfig:{thinkingLevel:'low'}
          }
        }),
        new Promise((_,reject)=>setTimeout(()=>reject(new Error('Gemini liveness timeout')),15000))
      ]);
      const parsed=parseJson((response as any).text||'');
      if(typeof parsed.has_gesture==='boolean'&&typeof parsed.is_face_clear==='boolean'&&typeof parsed.is_live==='boolean')return parsed;
      throw new Error('Gemini returned an incomplete liveness result');
    }catch(err){
      lastError=err;
      console.warn(`Gemini liveness model ${model} failed:`,err instanceof Error?err.message:err);
    }
  }
  throw lastError||new Error('No Gemini liveness model available');
}

export async function verifyPeaceSignLiveness(base64Data:string,_mimeType:string='image/jpeg'):Promise<LivenessVerificationResult>{
  const {base64,mimeType,challenge}=extractChallenge(base64Data);
  if(!base64||base64.length<1000)return{passed:false,is_live:false,has_peace_sign:false,is_face_clear:false,has_gesture:false,challenge,confidence:0,message:'Photo capture is missing or incomplete. Please take a clear selfie.'};
  const ai=getAiClient();
  if(!ai)return{passed:false,is_live:false,has_peace_sign:false,is_face_clear:false,has_gesture:false,challenge,confidence:0,message:'Liveness verification is temporarily unavailable. Please try again.'};
  try{
    const p=await generateVerification(ai,base64,mimeType,challenge);
    const isLive=Boolean(p.is_live);
    const hasGesture=Boolean(p.has_gesture);
    const faceClear=Boolean(p.is_face_clear);
    const confidence=Math.min(100,Math.max(0,Number(p.confidence)||0));
    const passed=isLive&&hasGesture&&faceClear;
    const gesture=LABELS[challenge];
    return{
      passed,
      is_live:isLive,
      has_peace_sign:Boolean(p.has_peace_sign),
      is_face_clear:faceClear,
      has_gesture:hasGesture,
      challenge,
      confidence,
      message:passed?`Liveness verified with ${gesture}.`:`Please show ${gesture} with one hand, keep your full face visible, and take the photo in good lighting.`
    };
  }catch(err:any){
    console.warn('Gemini liveness check failed:',err?.message||err);
    return{passed:false,is_live:false,has_peace_sign:false,is_face_clear:false,has_gesture:false,challenge,confidence:0,message:'We could not complete the liveness check. Please try again.'};
  }
}

export async function verifyFaceMatchAgainstLive(livePhotoBase64:string,profilePhotoBase64:string,mimeType:string='image/jpeg'):Promise<FaceMatchVerificationResult>{
  const live=extractChallenge(livePhotoBase64);const profile=extractChallenge(profilePhotoBase64);
  if(!profile.base64||profile.base64.length<1000)return{passed:false,similarity_percentage:0,is_same_person:false,is_ai_generated:false,confidence:0,feedback:'Please select a clear photo to upload.'};
  const ai=getAiClient();
  if(ai&&live.base64){
    try{
      const response=await ai.models.generateContent({model:'gemini-3.8-flash',contents:{parts:[{inlineData:{mimeType:live.mimeType,data:live.base64}},{inlineData:{mimeType:profile.mimeType||mimeType,data:profile.base64}},{text:'You are an identity verification and anti-fraud system for FlatMate+. Image 1 is the user live selfie. Image 2 is the profile photo. Compare facial structure and estimate resemblance 0-100. Inspect Image 2 for obvious AI/synthetic generation. Pass only when resemblance >=65 and the profile photo is not AI-generated. Return JSON only.'}]},config:{responseMimeType:'application/json',responseSchema:{type:Type.OBJECT,properties:{similarity_percentage:{type:Type.NUMBER},is_same_person:{type:Type.BOOLEAN},is_ai_generated:{type:Type.BOOLEAN},passed:{type:Type.BOOLEAN},confidence:{type:Type.NUMBER},feedback:{type:Type.STRING}},required:['similarity_percentage','is_same_person','is_ai_generated','passed','confidence','feedback']},thinkingConfig:{thinkingLevel:'low'}}});
      const p=parseJson(response.text||'');const sim=Math.min(100,Math.max(0,Math.round(Number(p.similarity_percentage)||0)));const isAi=Boolean(p.is_ai_generated);return{passed:sim>=65&&!isAi,similarity_percentage:sim,is_same_person:Boolean(p.is_same_person),is_ai_generated:isAi,confidence:Math.min(100,Math.max(0,Number(p.confidence)||90)),feedback:p.feedback||(isAi?'AI-generated or synthetic photos are not permitted. Please upload a genuine photo.':sim>=65?'Photo verified successfully.':'Photo does not clearly match your live photo. Please upload a clearer photo.')};
    }catch(err:any){console.warn('Gemini face match check failed:',err?.message||err);}
  }
  return{passed:false,similarity_percentage:0,is_same_person:false,is_ai_generated:false,confidence:0,feedback:'Photo verification is temporarily unavailable. Please try again.'};
}

export function verifyPhotoUpload(base64Data:string,mimeType:string):VerificationResult{if(!base64Data)return{verified:false,confidence:0,message:'Please select or take a photo to upload.'};const valid=['image/jpeg','image/jpg','image/png','image/webp'];const n=(mimeType||'').toLowerCase();if(n&&!valid.some(m=>n.includes(m.split('/')[1])))return{verified:false,confidence:0,message:'Unsupported file type. Please upload a JPG, PNG, or WEBP photo.'};const comma=base64Data.indexOf(',');const len=comma>=0?base64Data.length-comma-1:base64Data.length;const bytes=(len*3)/4;if(bytes>8*1024*1024)return{verified:false,confidence:0,message:'Photo exceeds the maximum size of 8MB. Please upload a smaller image.'};if(bytes<1000)return{verified:false,confidence:0,message:'Image file appears incomplete or damaged. Please select a clear photo.'};return{verified:true,confidence:95,message:'Photo verified successfully.'};}
