import React, {useState, useEffect} from 'react'
import { apiClient } from '../api'
import { getActiveAccessToken } from '../utils/sessions'

export default function ProfileCreate(){
  const [profile, setProfile] = useState({gender:'', bio:'', skill_ids:[], hobby_ids:[]})
  useEffect(()=>{
  },[])
  const submit = async e=>{
    e.preventDefault()
  const token = getActiveAccessToken() || localStorage.getItem('access')
    try{
  await apiClient(token).patch('profile/update/', profile)
      alert('Saved')
    }catch(err){
      console.error(err)
      alert('Error saving')
    }
  }
  return (
    <div className="form card">
      <h2>Create / Edit Profile</h2>
      <form onSubmit={submit}>
        <select value={profile.gender} onChange={e=>setProfile({...profile, gender:e.target.value})}>
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <textarea placeholder="Bio" value={profile.bio} onChange={e=>setProfile({...profile, bio:e.target.value})}></textarea>
        <input placeholder="Skills (comma separated)" value={profile.skill_ids.join(',')} onChange={e=>setProfile({...profile, skill_ids: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
        <input placeholder="Hobbies (comma separated)" value={profile.hobby_ids.join(',')} onChange={e=>setProfile({...profile, hobby_ids: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
        <button className="btn">Save profile</button>
      </form>
    </div>
  )
}
