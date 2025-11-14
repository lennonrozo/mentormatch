import React, { useEffect, useState } from 'react'
import { apiClient } from '../api'
import { getActiveAccessToken } from '../utils/sessions'
import { logApiError } from '../utils/errors'

export default function Settings(){
  const token = getActiveAccessToken() || localStorage.getItem('access')
  const [settings, setSettings] = useState({show_phone:false, show_email:false, show_age:false, theme:'light'})

  useEffect(()=>{
    apiClient(token).get('profile/').then(res=>{
      setSettings(s=>({
        ...s,
        show_phone: !!res.data.show_phone,
        show_email: !!res.data.show_email,
        show_age: !!res.data.show_age,
        theme: res.data.theme || 'light',
        deletion_scheduled_at: res.data.deletion_scheduled_at
      }))
      if(res.data.theme) document.documentElement.setAttribute('data-theme', res.data.theme)
    }).catch(()=>{})
  },[])

  const save = async () =>{
    try{
      await apiClient(token).patch('profile/update/', settings)
      document.documentElement.dataset.theme = settings.theme
      alert('Saved settings')
    }catch(err){ const msg = logApiError('Settings save failed', err); alert(`Failed to save:\n${msg}`) }
  }

  const scheduleDeletion = async () =>{
    try{ await apiClient(token).post('account/deletion/') ; alert('Deletion scheduled. Log in again within 7 days to cancel.') }
    catch(e){ const msg = logApiError('Deletion schedule failed', e); alert(`Could not schedule deletion:\n${msg}`) }
  }

  const cancelDeletion = async () =>{
    try{ await apiClient(token).delete('account/deletion/') ; alert('Deletion canceled') }
    catch(e){ const msg = logApiError('Deletion cancel failed', e); alert(`Could not cancel:\n${msg}`) }
  }

  return (
    <div className="card">
      <h2 style={{marginTop:0, marginBottom:'24px', fontSize:'24px', fontWeight:'600'}}>Settings</h2>
      
      <div className="info-card" style={{marginBottom:'16px'}}>
        <div className="info-label">Privacy Settings</div>
        <div style={{display:'flex', flexDirection:'column', gap:'12px', marginTop:'12px'}}>
          <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
            <input type="checkbox" checked={settings.show_phone} onChange={e=>setSettings(s=>({...s, show_phone:e.target.checked}))} style={{width:'18px', height:'18px', cursor:'pointer'}}/>
            <span style={{fontSize:'15px', fontWeight:'500'}}>Show phone number on profile</span>
          </label>
          <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
            <input type="checkbox" checked={settings.show_email} onChange={e=>setSettings(s=>({...s, show_email:e.target.checked}))} style={{width:'18px', height:'18px', cursor:'pointer'}}/>
            <span style={{fontSize:'15px', fontWeight:'500'}}>Show email address on profile</span>
          </label>
          <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
            <input type="checkbox" checked={settings.show_age} onChange={e=>setSettings(s=>({...s, show_age:e.target.checked}))} style={{width:'18px', height:'18px', cursor:'pointer'}}/>
            <span style={{fontSize:'15px', fontWeight:'500'}}>Show age on profile</span>
          </label>
        </div>
      </div>

      <div className="info-card" style={{marginBottom:'16px'}}>
        <div className="info-label">Appearance</div>
        <select value={settings.theme} onChange={e=>setSettings(s=>({...s, theme:e.target.value}))} style={{marginTop:'12px'}}>
          <option value="">Select theme</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div style={{marginTop:'20px'}}>
        <button className="btn" onClick={save}>Save Settings</button>
      </div>

      <hr style={{margin:'32px 0', border:'none', borderTop:'1px solid #e5e7eb'}} />
      
      <h3 style={{marginTop:0, marginBottom:'12px', fontSize:'20px', fontWeight:'600', color:'#dc2626'}}>Delete Account</h3>
      <p style={{fontSize:'14px', color:'#6b7280', lineHeight:'1.6', marginBottom:'16px'}}>Deleting your account will be processed after 7 days. Logging back in cancels deletion automatically.</p>
      {settings.deletion_scheduled_at && (
        <div className="info-card" style={{marginBottom:'16px', background:'#fef3c7', borderColor:'#fbbf24'}}>
          <p style={{margin:0, color:'#92400e', fontWeight:'500', fontSize:'14px'}}>⚠️ Deletion scheduled for: {new Date(settings.deletion_scheduled_at).toLocaleString()}</p>
        </div>
      )}
      <div style={{display:'flex', gap:'12px'}}>
        <button className="btn danger" onClick={scheduleDeletion}>Schedule deletion</button>
        <button className="btn" onClick={cancelDeletion} style={{background:'#6b7280'}}>Cancel deletion</button>
      </div>
    </div>
  )
}
