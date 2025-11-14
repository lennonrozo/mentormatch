// Static mock API client for GitHub Pages demo (no live backend).
// Each method returns a Promise that resolves to an object that loosely mimics
// Axios response shape ({ data }). Adjust the mock data as desired.

// Mock in-memory data (very lightweight). Real persistence is NOT supported.
const mockState = {
  currentUser: {
    id: 1,
    username: 'demo_user',
    bio: 'Static demo profile. Backend disabled.',
    skills_offered: ['JavaScript', 'React'],
    skills_needed: ['Django'],
  },
  matches: [
    { id: 101, user1: { username: 'demo_user' }, user2: { username: 'mentor_alex' } },
    { id: 102, user1: { username: 'demo_user' }, user2: { username: 'learner_sam' } },
  ],
  messages: {
    101: [
      { id: 1, sender: 'mentor_alex', content: 'Welcome to the static demo!', timestamp: new Date().toISOString() },
    ],
    102: [
      { id: 2, sender: 'learner_sam', content: 'This would be a conversation.', timestamp: new Date().toISOString() },
    ],
  },
};

function delay(ms = 250) { return new Promise(r => setTimeout(r, ms)); }

function clone(v){ return JSON.parse(JSON.stringify(v)); }

async function get(path){
  await delay();
  if(path === 'profile/me/') return { data: clone(mockState.currentUser) };
  if(path === 'matches/') return { data: clone(mockState.matches) };
  // Messages: /matches/:id/messages/
  const matchMsg = path.match(/^matches\/(\d+)\/messages\/$/);
  if(matchMsg){
    const id = matchMsg[1];
    return { data: clone(mockState.messages[id] || []) };
  }
  // Potential swipe demo (empty)
  if(path === 'potential-matches/') return { data: [] };
  return { data: null };
}

async function post(path, payload){
  await delay();
  // Simulate login success
  if(path === 'token/'){ return { data: { access: 'STATIC_ACCESS', refresh: 'STATIC_REFRESH' } }; }
  // Simulate signup
  if(path === 'users/'){ return { data: { id: 999, username: payload.username } }; }
  // Messages
  const msgMatch = path.match(/^matches\/(\d+)\/messages\/$/);
  if(msgMatch){
    const matchId = msgMatch[1];
    const newMsg = {
      id: Date.now(),
      sender: mockState.currentUser.username,
      content: payload.content,
      timestamp: new Date().toISOString(),
    };
    mockState.messages[matchId] = mockState.messages[matchId] || [];
    mockState.messages[matchId].push(newMsg);
    return { data: newMsg };
  }
  return { data: payload };
}

async function put(path, payload){
  await delay();
  if(path === 'profile/me/'){ Object.assign(mockState.currentUser, payload); return { data: clone(mockState.currentUser) }; }
  return { data: payload };
}

async function _delete(path){
  await delay();
  return { data: null };
}

// The exported factory maintains previous signature but ignores token.
export function apiClient(){
  return { get, post, put, delete: _delete };
}

export default apiClient;
