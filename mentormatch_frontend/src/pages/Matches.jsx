import React, {useEffect, useState} from 'react'
import { apiClient } from '../api'
import { getActiveAccessToken, getActiveUsername } from '../utils/sessions'

export default function Matches(){
  const [matches, setMatches] = useState([])

  useEffect(()=>{
  const token = getActiveAccessToken() || localStorage.getItem('access')
    apiClient(token).get('matches/')
      .then(res=>setMatches(res.data))
      .catch(err=>console.error(err))
  },[])

  return (
    <div>
      <h2>Your matches</h2>
      {/* render one card per match; m.user1 and m.user2 represent the two users involved */}
      {matches.map(m=> {
  const me = getActiveUsername() || localStorage.getItem('username') || ''
        const partner = m.user1.username === me ? m.user2 : m.user1
        return (
          <div className="card" key={m.id}>
            <h4>{partner.username}</h4>
          </div>
        )
      })}
      {matches.length === 0 && <p>No matches yet. Keep swiping!</p>}
    </div>
  )
}
