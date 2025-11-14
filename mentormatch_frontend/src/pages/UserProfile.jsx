import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiClient } from '../api'
import { getActiveAccessToken } from '../utils/sessions'

export default function UserProfile(){
  const { id } = useParams()
  const [user,setUser] = useState(null)
  const [media, setMedia] = useState([])
  const token = getActiveAccessToken() || localStorage.getItem('access')
  const ageRange = (dob)=>{
    if(!dob) return null
    const d = new Date(dob)
    const age = Math.floor((Date.now()-d.getTime())/31557600000)
    if(age<18) return '<18'
    if(age<25) return '18-24'
    if(age<35) return '25-34'
    if(age<45) return '35-44'
    if(age<55) return '45-54'
    return '55+'
  }

  useEffect(()=>{
    if(!id) return
    apiClient(token).get(`users/${id}/`).then(res=>setUser(res.data)).catch(console.error)
    apiClient(token).get(`media/${id}/`).then(res=>setMedia(res.data)).catch(()=>setMedia([]))
  },[id])

  if(!user) return <div className="card">Loading profile...</div>
  return (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <Link to={-1}>&larr; Back</Link>
        <h2>{user.username}</h2>
        <span style={{opacity:0}}>spacer</span>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        <div>
          <h3>About</h3>
          <p>{user.bio || 'No bio yet.'}</p>
          <div className="grid-2">
            <div><strong>Role</strong><div>{user.role}</div></div>
            <div><strong>Location</strong><div>{[user.city,user.state,user.country].filter(Boolean).join(', ')||'—'}</div></div>
            <div><strong>Age</strong><div>{ageRange(user.date_of_birth) || '—'}</div></div>
          </div>
          <div style={{marginTop:12}}>
            <strong>Skills offered</strong>
            <div className="chips">{(user.skills_offered||[]).map(s=> <span key={s.id} className="chip">{s.name}</span>)}</div>
          </div>
          <div style={{marginTop:8}}>
            <strong>Skills needed</strong>
            <div className="chips">{(user.skills_needed||[]).map(s=> <span key={s.id} className="chip alt">{s.name}</span>)}</div>
          </div>
        </div>
        <div>
          <h3>Media</h3>
          <p style={{opacity:0.8}}>Media is unavailable in static demo mode.</p>
        </div>
      </div>
    </div>
  )
}
