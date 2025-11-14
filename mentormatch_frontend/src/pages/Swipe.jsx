import React, {useEffect, useState} from 'react'
import { apiClient } from '../api'
import { getActiveAccessToken } from '../utils/sessions'

export default function Swipe(){
  const [candidates, setCandidates] = useState([])
  const [index, setIndex] = useState(0)

  const [filters, setFilters] = useState({offered:'', needed:'', global:false})

  const load = ()=>{
  const token = getActiveAccessToken() || localStorage.getItem('access')
    const params = new URLSearchParams()
    if(filters.offered) params.append('offered', filters.offered)
    if(filters.needed) params.append('needed', filters.needed)
    if(filters.global) params.append('global', '1')
    apiClient(token).get(`potential/${params.toString()?`?${params.toString()}`:''}`)
      .then(res=>{ setCandidates(res.data); setIndex(0) })
      .catch(err=>console.error(err))
  }

  useEffect(()=>{ load() },[])

  const doSwipe = async liked =>{
  const token = getActiveAccessToken() || localStorage.getItem('access')
    if(!candidates[index]) return
    const id = candidates[index].user.id
    try{
      const res = await apiClient(token).post('swipe/', {to_user:id, liked})
      if(res.data.matched){
        alert('It\'s a match!')
      }
    }catch(err){console.error(err)}
    setIndex(i=>i+1)
  }

  const current = candidates[index]
  return (
    <div className="card">
      <h3>Potential Matches</h3>
      <div className="filters" style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:8}}>
        {/* simple inputs bound to the filters state above */}
        <input placeholder="Filter by skill offered" value={filters.offered} onChange={e=>setFilters({...filters, offered:e.target.value})} />
        <input placeholder="Filter by skill needed" value={filters.needed} onChange={e=>setFilters({...filters, needed:e.target.value})} />
        <label style={{display:'flex', alignItems:'center', gap:6}}>
          <input type="checkbox" checked={filters.global} onChange={e=>setFilters({...filters, global:e.target.checked})} /> Global
        </label>
        <button className="btn" onClick={load}>Apply</button>
      </div>
      {current ? (
        <div>
          <div style={{padding:12}}>
            {/* show the candidate's basic info and the compatibility score from the backend */}
            <h4>{current.user.username} <small style={{color:'#666'}}>({current.user.role})</small></h4>
            <p>{current.user.bio}</p>
            <p>Score: {current.score}</p>
            <div style={{marginTop:6}}>
              <strong>Offers:</strong> {(current.user.skills_offered||[]).map(s=>s.name).join(', ') || '—'}
            </div>
            <div>
              <strong>Needs:</strong> {(current.user.skills_needed||[]).map(s=>s.name).join(', ') || '—'}
            </div>
          </div>
          <div className="swipe-actions">
            {/* pass = not interested, like = interested. The server detects mutual likes */}
            <button onClick={()=>doSwipe(false)} className="btn" style={{background:'#eee', color:'#333'}}>Pass</button>
            <button onClick={()=>doSwipe(true)} className="btn">Like</button>
          </div>
        </div>
      ) : (
        <p>No more candidates</p>
      )}
    </div>
  )
}
