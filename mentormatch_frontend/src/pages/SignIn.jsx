import React, {useState} from 'react'
import { apiClient } from '../api'
import { extractFieldErrors } from '../utils/errors'
import { createSession } from '../utils/sessions'
import { FiLogIn, FiUserPlus } from 'react-icons/fi'
import { useNavigate, Link } from 'react-router-dom'

export default function SignIn(){
  const [form,setForm] = useState({username:'', password:''})
  const [errors,setErrors] = useState({})
  const nav = useNavigate()
  const submit = async e=>{
    e.preventDefault()
    setErrors({})
    try{
  const res = await apiClient().post('token/', form)
  localStorage.setItem('access', res.data.access)
  localStorage.setItem('refresh', res.data.refresh)
  localStorage.setItem('username', form.username)
      try{
  const me = await apiClient(res.data.access).get('profile/')
        localStorage.setItem('user_id', me.data.id)
        // also create an isolated session so multiple tabs can log in as different users
        createSession({ username: form.username, access: res.data.access, refresh: res.data.refresh, user_id: me.data.id })
      }catch{ /* ignore */ }
      nav('/swipe')
    }catch(err){
      setErrors(extractFieldErrors(err))
    }
  }

  return (
    <div style={{maxWidth:'480px', margin:'0 auto', paddingTop:'16px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'48px', padding:'0 4px'}}>
        <div className="brand" style={{fontSize:'28px'}}><span className="mentor">Mentor</span><span className="match">Match</span></div>
        <div className="auth-nav-inline">
          <Link to="/signin" className="auth-nav-item active">
            <FiLogIn />
            <span>Login</span>
          </Link>
          <Link to="/signup" className="auth-nav-item">
            <FiUserPlus />
            <span>Sign Up</span>
          </Link>
        </div>
      </div>
      <div className="form card" style={{padding:'32px'}}>
        <h2 style={{fontSize:'32px', fontWeight:'700', marginBottom:'8px', textAlign:'center', marginTop:0}}>Sign In</h2>
        <p style={{color:'#6b7280', textAlign:'center', marginBottom:'32px', fontSize:'15px', marginTop:0}}>Use your registered account credentials.</p>
        {errors.non_field_errors && (
          <div className="error-banner">{errors.non_field_errors.join('\n')}</div>
        )}
        <form onSubmit={submit}>
          {/* controlled inputs bound to form state */}
          <input className={errors.username? 'input-error':''} placeholder="Username" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} />
          {errors.username && <div className="error-text">{errors.username.join(', ')}</div>}
          <input type="password" className={errors.password? 'input-error':''} placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
          {errors.password && <div className="error-text">{errors.password.join(', ')}</div>}
          <button className="btn" style={{width:'100%', marginTop:'8px', padding:'16px', fontSize:'16px', fontWeight:'600'}}>Login</button>
        </form>
        <p style={{textAlign:'center', marginTop:'24px', marginBottom:0, color:'#6b7280', fontSize:'14px'}}>New user? <Link to="/signup" style={{color:'var(--accent)', fontWeight:'600', textDecoration:'none'}}>Create Account</Link></p>
      </div>
    </div>
  )
}
