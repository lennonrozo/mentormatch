const SESSIONS_KEY = 'mm_sessions_v1'
const ACTIVE_SESSION_ID_KEY = 'mm_active_session_id'

function genId(){
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  ).toLowerCase()
}

function readSessions(){
  try{ return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}') }catch{ return {} }
}

function writeSessions(map){
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(map))
}

export function createSession({ username, access, refresh, user_id }){
  const id = genId()
  const all = readSessions()
  all[id] = { id, username, access, refresh, user_id, createdAt: new Date().toISOString() }
  writeSessions(all)
  setActiveSessionId(id)
  return id
}

export function setActiveSessionId(id){
  if(!id) return
  sessionStorage.setItem(ACTIVE_SESSION_ID_KEY, id)
}

export function getActiveSessionId(){
  return sessionStorage.getItem(ACTIVE_SESSION_ID_KEY) || null
}

export function getActiveSession(){
  const id = getActiveSessionId()
  if(!id) return null
  const all = readSessions()
  return all[id] || null
}

export function getActiveAccessToken(){
  const s = getActiveSession()
  return s?.access || null
}

export function getActiveUsername(){
  const s = getActiveSession()
  return s?.username || ''
}

export function getActiveUserId(){
  const s = getActiveSession()
  return s?.user_id || null
}

export function listSessions(){
  const all = readSessions()
  return Object.values(all)
}

export function removeSession(id){
  const all = readSessions()
  delete all[id]
  writeSessions(all)
  const active = getActiveSessionId()
  if(active === id) sessionStorage.removeItem(ACTIVE_SESSION_ID_KEY)
}
