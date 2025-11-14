import React, {useEffect, useState, useRef} from 'react'
import { apiClient } from '../api'
import { getActiveAccessToken, getActiveUsername } from '../utils/sessions'
import { Link } from 'react-router-dom'

export default function Connections(){
  const [matches, setMatches] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const listRef = useRef()
  const pollRef = useRef(null)
  const lastTsRef = useRef(null)

  useEffect(()=>{
  const token = getActiveAccessToken() || localStorage.getItem('access')
    apiClient(token).get('matches/')
      .then(res=>setMatches(res.data))
      .catch(err=>console.error(err))
  },[])

  useEffect(()=>{
    if(!selected) return
  const token = getActiveAccessToken() || localStorage.getItem('access')
    apiClient(token).get(`messages/${selected.id}/`)
      .then(res=>{
        setMessages(res.data)
        // capture last message timestamp for incremental polling
        lastTsRef.current = res.data.length ? res.data[res.data.length-1].timestamp : null
        // scroll
        setTimeout(()=>{ if(listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, 50)
      })
      .catch(err=>console.error(err))
  },[selected])

  // Poll for new messages every few seconds while a conversation is open
  useEffect(()=>{
    if(!selected) return
    const token = getActiveAccessToken() || localStorage.getItem('access')
    if(pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async ()=>{
      try{
        const qs = lastTsRef.current ? `?since=${encodeURIComponent(lastTsRef.current)}` : ''
        const res = await apiClient(token).get(`messages/${selected.id}/${qs}`)
        if(Array.isArray(res.data) && res.data.length){
          setMessages(prev => {
            const merged = [...prev, ...res.data]
            lastTsRef.current = merged[merged.length-1]?.timestamp || lastTsRef.current
            // auto-scroll to bottom on new messages
            setTimeout(()=>{ if(listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, 30)
            return merged
          })
        }
      }catch(_e){ /* ignore transient errors during polling */ }
    }, 4000)
    return ()=>{ if(pollRef.current) clearInterval(pollRef.current) }
  }, [selected])

  const send = async e =>{
    e.preventDefault()
    if(!selected || !text.trim()) return
  const token = getActiveAccessToken() || localStorage.getItem('access')
    try{
  const res = await apiClient(token).post(`messages/${selected.id}/`, {match: selected.id, content: text})
  setMessages(m=>[...m, res.data])
      lastTsRef.current = res.data.timestamp || lastTsRef.current
      setText('')
      setTimeout(()=>{ if(listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, 50)
    }catch(err){console.error(err)}
  }

  return (
    <div style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:12}}>
      <div className="card">
        <h3>Your Matches</h3>
        <div className="matches-list">
          {matches.map(m=>{
            const partner = m.user1.username === (getActiveUsername() || localStorage.getItem('username') || '') ? m.user2 : m.user1
            return (
              <div key={m.id} className="match-item" onClick={()=>setSelected(m)} style={{cursor:'pointer'}}>
                <strong>{partner.username}</strong>
                <div style={{fontSize:12, color:'#666'}}>{new Date(m.timestamp).toLocaleString()}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="card" style={{display:'flex', flexDirection:'column'}}>
        {selected ? (
          <>
            {(() => {
              const me = getActiveUsername() || localStorage.getItem('username') || ''
              const partner = selected.user1.username === me ? selected.user2 : selected.user1
              return <h3>{partner.username}</h3>
            })()}
            {selected && (
              <div style={{marginBottom:8}}>
                {/* determine partner id for profile link */}
                {(() => {
                  const me = getActiveUsername() || localStorage.getItem('username') || ''
                  const partner = selected.user1.username === me ? selected.user2 : selected.user1
                  return <Link to={`/user/${partner.id}`} className="btn" style={{padding:'4px 8px', fontSize:12}}>View {partner.username}'s Profile</Link>
                })()}
              </div>
            )}
            <div className="messages" ref={listRef}>
              {messages.reduce((acc, msg, idx) => {
                const msgDate = new Date(msg.timestamp)
                const msgDateStr = msgDate.toLocaleDateString()
                const prevDate = idx > 0 ? new Date(messages[idx-1].timestamp).toLocaleDateString() : null
                // Insert date divider if this is first message or date changed
                if (msgDateStr !== prevDate) {
                  // Determine label: Today, Yesterday, or MM/DD/YYYY
                  const now = new Date()
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                  const yesterday = new Date(today)
                  yesterday.setDate(yesterday.getDate() - 1)
                  const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate())
                  
                  let dateLabel = msgDateStr
                  if (msgDay.getTime() === today.getTime()) {
                    dateLabel = 'Today'
                  } else if (msgDay.getTime() === yesterday.getTime()) {
                    dateLabel = 'Yesterday'
                  } else {
                    // Format as MM/DD/YYYY
                    const month = String(msgDate.getMonth() + 1).padStart(2, '0')
                    const day = String(msgDate.getDate()).padStart(2, '0')
                    const year = msgDate.getFullYear()
                    dateLabel = `${month}/${day}/${year}`
                  }
                  
                  acc.push(
                    <div key={`date-${msg.id}`} style={{textAlign:'center', margin:'16px 0 8px', fontSize:13, color:'#888', fontWeight:'500'}}>
                      {dateLabel}
                    </div>
                  )
                }
                acc.push(
                  <div key={msg.id} className={`message ${msg.sender.username === (getActiveUsername() || localStorage.getItem('username')||'') ? 'self' : 'other'}`}>
                    <div style={{fontSize:12, color:'#555'}}><strong>{msg.sender.username}</strong> • {new Date(msg.timestamp).toLocaleTimeString()}</div>
                    <div>{msg.content}</div>
                  </div>
                )
                return acc
              }, [])}
            </div>
            <form onSubmit={send} style={{marginTop:12, display:'flex', gap:8}}>
              <input value={text} onChange={e=>setText(e.target.value)} placeholder='Write a message...' style={{flex:1, padding:8, borderRadius:8}} />
              <button className="btn">Send</button>
            </form>
          </>
        ) : (
          <div style={{textAlign:'center', color:'#666'}}>
            <h4>No conversation selected</h4>
            <p>Select a match on the left to open the chat.</p>
          </div>
        )}
      </div>
    </div>
  )
}
