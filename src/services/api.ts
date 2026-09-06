import { AuthUser, UserProfile, DiscoverProfile, MatchItem, MessageItem, BlockRecord, UserSettings, DiscoverFilters } from '../types.js';

const TOKEN_KEY = 'flatmate_plus_token';
export function getStoredToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
export function setStoredToken(token: string) { localStorage.setItem(TOKEN_KEY, token); }
export function clearStoredToken() { localStorage.removeItem(TOKEN_KEY); }

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string,string> = { 'Content-Type':'application/json', ...(options.headers as Record<string,string> || {}) };
  if (token) headers.Authorization=`Bearer ${token}`;
  try { const res=await fetch(endpoint,{...options,headers}); const data=await res.json(); if(!res.ok) throw new Error(data.error||'Something went wrong. Please try again.'); return data as T; }
  catch(err:any){ if(err.message?.includes('Failed to fetch')) throw new Error("Couldn't reach the server. Please check your internet connection."); throw err; }
}

/** Downsize photos before they enter the API/database. Keeps the app's data-URL API unchanged. */
export async function compressImageDataUrl(dataUrl: string, maxDimension = 1600, quality = 0.78): Promise<string> {
  if (!dataUrl?.startsWith('data:image/')) return dataUrl;
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale=Math.min(1,maxDimension/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(img.naturalWidth*scale)); canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext('2d'); if(!ctx){resolve(dataUrl);return;}
      ctx.drawImage(img,0,0,canvas.width,canvas.height); resolve(canvas.toDataURL('image/webp',quality));
    };
    img.onerror=()=>resolve(dataUrl); img.src=dataUrl;
  });
}

function addLivenessChallenge(dataUrl: string, challenge?: string): string {
  if (!challenge || !dataUrl.startsWith('data:')) return dataUrl;
  return dataUrl.replace(/^data:([^;]+);base64,/, `data:$1;challenge=${challenge};base64,`);
}

export const api = {
  async signup(payload:{email:string;password:string;name?:string}):Promise<{token:string;user:AuthUser}>{const res=await request<{token:string;user:AuthUser}>('/api/auth/signup',{method:'POST',body:JSON.stringify(payload)});if(res.token)setStoredToken(res.token);return res;},
  async login(payload:{email:string;password:string}):Promise<{token:string;user:AuthUser}>{const res=await request<{token:string;user:AuthUser}>('/api/auth/login',{method:'POST',body:JSON.stringify(payload)});if(res.token)setStoredToken(res.token);return res;},
  async googleAuth(payload:{email:string;name?:string;google_id?:string;photo_url?:string}):Promise<{token:string;user:AuthUser}>{const res=await request<{token:string;user:AuthUser}>('/api/auth/google',{method:'POST',body:JSON.stringify(payload)});if(res.token)setStoredToken(res.token);return res;},
  async sendOtp(phone:string){return request<{success:boolean;message:string;dev_code?:string}>('/api/auth/send-otp',{method:'POST',body:JSON.stringify({phone})});},
  async verifyOtp(phone:string,otp:string){return request<{success:boolean;phone_verified:boolean;message:string}>('/api/auth/verify-otp',{method:'POST',body:JSON.stringify({phone,otp})});},
  async getMe(){return request<{user:AuthUser;settings:UserSettings}>('/api/auth/me');},
  async deleteAccount(confirmation:string){const res=await request<{success:boolean;message:string}>('/api/auth/delete-account',{method:'DELETE',body:JSON.stringify({confirmation})});clearStoredToken();return res;},
  async verifyLiveness(payload:{photo_base64:string;mime_type:string;challenge?:string}){const challenged=addLivenessChallenge(payload.photo_base64,payload.challenge);return request<{success:boolean;passed:boolean;confidence:number;message:string}>('/api/verify/liveness',{method:'POST',body:JSON.stringify({...payload,photo_base64:challenged})});},
  async verifyFaceMatch(payload:{live_photo_base64?:string;profile_photo_base64:string;mime_type?:string}){const compressed=await compressImageDataUrl(payload.profile_photo_base64);return request<{success:boolean;passed:boolean;similarity_percentage:number;is_ai_generated:boolean;feedback:string}>('/api/verify/face-match',{method:'POST',body:JSON.stringify({...payload,profile_photo_base64:compressed})});},
  async updateIntent(intent:{has_house:boolean;looking_to_co_search:boolean;looking_for_vacancy:boolean}){return request<{profile:UserProfile}>('/api/profile/intent',{method:'PUT',body:JSON.stringify(intent)});},
  async updateProfile(updates:Partial<UserProfile>){return request<{profile:UserProfile}>('/api/profile',{method:'PUT',body:JSON.stringify(updates)});},
  async uploadPhoto(payload:{photo_base64:string;mime_type:string;caption?:string;is_main?:boolean}){const compressed=await compressImageDataUrl(payload.photo_base64);return request<{success:boolean;photo:any;profile:UserProfile}>('/api/profile/upload-photo',{method:'POST',body:JSON.stringify({...payload,photo_base64:compressed,mime_type:'image/webp'})});},
  async uploadHousePhoto(payload:{photo_base64:string;mime_type:string;caption?:string}){const compressed=await compressImageDataUrl(payload.photo_base64);return request<{success:boolean;photo:any;house_details:any;profile:UserProfile}>('/api/profile/upload-house-photo',{method:'POST',body:JSON.stringify({...payload,photo_base64:compressed,mime_type:'image/webp'})});},
  async reactivateDiscover(){return request<{success:boolean;profile:UserProfile}>('/api/profile/reactivate-discover',{method:'POST'});},
  async getDiscoverProfiles(filters?:DiscoverFilters){const params=new URLSearchParams();if(filters)Object.entries(filters).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!==''){if(Array.isArray(v)){if(v.length)params.append(k,v.join(','));}else params.append(k,String(v));}});const query=params.toString()?`?${params}`:'';return request<{profiles:DiscoverProfile[];total:number;timestamp:number}>(`/api/discover${query}`);},
  async swipe(target_user_id:string,action:'like'|'pass'){return request<{success:boolean;is_match:boolean;match?:MatchItem}>('/api/discover/swipe',{method:'POST',body:JSON.stringify({target_user_id,action})});},
  async getPassedProfiles(){return request<{profiles:DiscoverProfile[];total:number}>('/api/discover/passed');},
  async undoPass(target_user_id:string){return request<{success:boolean}>('/api/discover/undo-pass',{method:'POST',body:JSON.stringify({target_user_id})});},
  async getMatches(){return request<{matches:MatchItem[]}>('/api/matches');},
  async getMatchDetail(matchId:string){return request<{match:MatchItem;messages:MessageItem[]}>(`/api/matches/${matchId}`);},
  async sendMessage(matchId:string,content:string){return request<{message:MessageItem}>(`/api/matches/${matchId}/messages`,{method:'POST',body:JSON.stringify({content})});},
  async markMessagesRead(matchId:string){return request<{success:boolean}>(`/api/matches/${matchId}/read`,{method:'POST'});},
  async requestMovingIn(matchId:string){return request<{success:boolean;both_confirmed:boolean;match:MatchItem;message:string}>(`/api/matches/${matchId}/moving-in`,{method:'POST'});},
  async blockUser(target_user_id:string,reason?:string){return request<{success:boolean;message:string}>('/api/users/block',{method:'POST',body:JSON.stringify({target_user_id,reason})});},
  async reportUser(target_user_id:string,reason:string,details?:string){return request<{success:boolean;message:string}>('/api/users/report',{method:'POST',body:JSON.stringify({target_user_id,reason,details})});},
  async getBlockedUsers(){return request<{blocked_users:BlockRecord[]}>('/api/users/blocked');},
  async unblockUser(target_user_id:string){return request<{success:boolean;message:string}>('/api/users/unblock',{method:'POST',body:JSON.stringify({target_user_id})});},
  async getSettings(){return request<{settings:UserSettings}>('/api/settings');},
  async updateSettings(settings:Partial<UserSettings>){return request<{settings:UserSettings}>('/api/settings',{method:'PUT',body:JSON.stringify(settings)});}
};
