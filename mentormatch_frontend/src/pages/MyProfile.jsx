import React, { useEffect, useState } from 'react'
import { apiClient, API_BASE } from '../api'
import { logApiError, extractFieldErrors } from '../utils/errors'
import { getActiveAccessToken } from '../utils/sessions'
import { FiLogOut } from 'react-icons/fi'

export default function MyProfile(){
  const [user,setUser] = useState(null)
  const [media,setMedia] = useState([])
  const [newMedia,setNewMedia] = useState(null)
  const [form,setForm] = useState({city:'',state:'',country:'',email:'',phone:'',bio:'',dob:''})
  const [errors,setErrors] = useState(null)
  const [skillsOffered,setSkillsOffered] = useState('')
  const [skillsNeeded,setSkillsNeeded] = useState('')
  const token = getActiveAccessToken() || localStorage.getItem('access')

  useEffect(()=>{
    apiClient(token).get('profile/').then(res=>{
      setUser(res.data)
      setForm({
        city: res.data.city||'', state: res.data.state||'', country: res.data.country||'',
        email: res.data.email||'', phone: res.data.phone||'', bio: res.data.bio||'', dob: res.data.date_of_birth||''
      })
      setSkillsOffered((res.data.skills_offered||[]).map(s=>s.name).join(', '))
      setSkillsNeeded((res.data.skills_needed||[]).map(s=>s.name).join(', '))
      return apiClient(token).get(`media/${res.data.id}/`)
    }).then(res=>setMedia(res.data)).catch(()=>setMedia([]))
  },[])

  const upload = async e => {
    e.preventDefault()
    if(!newMedia) return
    const formData = new FormData()
    formData.append('file', newMedia)
    formData.append('media_type', newMedia.type.startsWith('video')?'video':'image')
    try{
      const res = await apiClient(token).post(`media/${user.id}/`, formData, {headers:{'Content-Type':'multipart/form-data'}})
      setMedia(m=>[res.data,...m])
      setNewMedia(null)
    }catch(err){
      const msg = logApiError('Media upload failed', err)
      alert(`Upload failed:\n${msg}`)
    }
  }

  if(!user) return <div className="card">Loading...</div>
  return (
    <div className="card">
      <h2>My Profile</h2>
      <div className="form" style={{boxShadow:'none', maxWidth:'100%'}}>
  <textarea placeholder="Bio" value={form.bio} onChange={e=>setForm({...form, bio:e.target.value})} rows={3} />
        <div className="grid-2">
          <div>
            <input className={errors?.city? 'input-error':''} placeholder="City" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} />
            {errors?.city && <div className="error-text">{errors.city.join(', ')}</div>}
          </div>
          <div>
            <input className={errors?.state? 'input-error':''} placeholder="State" value={form.state} onChange={e=>setForm({...form, state:e.target.value})} />
            {errors?.state && <div className="error-text">{errors.state.join(', ')}</div>}
          </div>
          <div>
            <input className={errors?.country? 'input-error':''} placeholder="Country" value={form.country} onChange={e=>setForm({...form, country:e.target.value})} />
            {errors?.country && <div className="error-text">{errors.country.join(', ')}</div>}
          </div>
          <div>
            <input className={errors?.email? 'input-error':''} placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
            {errors?.email && <div className="error-text">{errors.email.join(', ')}</div>}
          </div>
          <div>
            <input className={errors?.phone? 'input-error':''} placeholder="Phone (e.g. +123456789)" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
            {errors?.phone && <div className="error-text">{errors.phone.join(', ')}</div>}
          </div>
          <div>
            <input type="date" className={errors?.date_of_birth? 'input-error':''} placeholder="Date of birth" value={form.dob||''} onChange={e=>setForm({...form, dob:e.target.value})} />
            {errors?.date_of_birth && <div className="error-text">{errors.date_of_birth.join(', ')}</div>}
          </div>
        </div>
        <input placeholder="Skills offered (comma separated, e.g. Python, Coaching)" value={skillsOffered} onChange={e=>setSkillsOffered(e.target.value)} />
        <input placeholder="Skills needed (comma separated, e.g. Public Speaking)" value={skillsNeeded} onChange={e=>setSkillsNeeded(e.target.value)} />
        <button className="btn" onClick={async ()=>{
          const payload = {
            bio: form.bio,
            city: form.city, state: form.state, country: form.country,
            email: form.email, phone: form.phone, date_of_birth: form.dob,
            skills_offered_ids: skillsOffered.split(',').map(s=>s.trim()).filter(Boolean),
            skills_needed_ids: skillsNeeded.split(',').map(s=>s.trim()).filter(Boolean)
          }
          try{ 
            setErrors(null)
            await apiClient(token).patch('profile/update/', payload); 
            const refreshed = await apiClient(token).get('profile/')
            setUser(refreshed.data)
            alert('Profile updated'); 
          }
          catch(e){ 
            const msg = logApiError('Profile update failed', e); 
            const fieldErrs = extractFieldErrors(e) || null
            setErrors(fieldErrs)
            if(!fieldErrs) alert(`Update failed:\n${msg}`)
          }
        }}>Save</button>
      </div>

      <div style={{marginTop:'32px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
        <div className="info-card">
          <div className="info-label">Role</div>
          <div className="info-value">{user.role}</div>
        </div>
        <div className="info-card">
          <div className="info-label">Location</div>
          <div className="info-value">{[user.city,user.state,user.country].filter(Boolean).join(', ')||'—'}</div>
        </div>
      </div>

      <div className="info-card" style={{marginTop:'16px'}}>
        <div className="info-label">Skills Offered</div>
        <div className="chips">{(user.skills_offered||[]).map(s=> <span key={s.id} className="chip">{s.name}</span>)}</div>
      </div>

      <div className="info-card" style={{marginTop:'16px'}}>
        <div className="info-label">Skills Needed</div>
        <div className="chips">{(user.skills_needed||[]).map(s=> <span key={s.id} className="chip alt">{s.name}</span>)}</div>
      </div>

      <hr style={{margin:'32px 0', border:'none', borderTop:'1px solid #e5e7eb'}} />
      <h3 style={{marginTop:0, marginBottom:'20px', fontSize:'20px', fontWeight:'600'}}>My Media</h3>
      <div className="media-grid">
        {media.map(m=> (
          <a href={`${API_BASE}${m.file}`} key={m.id} target="_blank" rel="noreferrer">
            {m.media_type==='image' ? <img src={`${API_BASE}${m.file}`} alt={m.caption||''} /> : <video src={`${API_BASE}${m.file}`} controls />}
          </a>
        ))}
      </div>
      <form onSubmit={upload} style={{display:'flex', flexDirection:'column', alignItems:'flex-start', gap:12, marginTop:'20px'}}>
        <input type="file" accept="image/*,video/*" onChange={e=>{
          const f = e.target.files[0];
          if(!f) return setNewMedia(null);
          // simple client-side size guard (server also validates)
          if(f.size > 10*1024*1024){ alert('Max file size is 10MB'); e.target.value=''; return; }
          setNewMedia(f)
        }} />
        <button className="btn" type="submit" disabled={!newMedia}>Upload</button>
      </form>
    </div>
  )
}
