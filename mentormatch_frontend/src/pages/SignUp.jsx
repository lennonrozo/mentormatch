import React, {useState} from 'react'
import { apiClient } from '../api'
import { extractFieldErrors } from '../utils/errors'
import { FiLogIn, FiUserPlus } from 'react-icons/fi'
import { useNavigate, Link } from 'react-router-dom'

export default function SignUp(){
  const [form, setForm] = useState({username:'', email:'', password:'', password2:'', role:'student'})
  const [errors, setErrors] = useState({})
  const nav = useNavigate()
  const submit = async e =>{
    e.preventDefault()
    try{
      setErrors({})
      await apiClient().post('register/', form)
      nav('/signin')
    }catch(err){
      setErrors(extractFieldErrors(err))
    }
  }
  return (
    <div style={{maxWidth:'480px', margin:'0 auto', paddingTop:'16px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'48px', padding:'0 4px'}}>
        <div className="brand" style={{fontSize:'28px'}}><span className="mentor">Mentor</span><span className="match">Match</span></div>
        <div className="auth-nav-inline">
          <Link to="/signin" className="auth-nav-item">
            <FiLogIn />
            <span>Login</span>
          </Link>
          <Link to="/signup" className="auth-nav-item active">
            <FiUserPlus />
            <span>Sign Up</span>
          </Link>
        </div>
      </div>
      <div className="form card" style={{padding:'32px'}}>
        <h2 style={{fontSize:'32px', fontWeight:'700', marginBottom:'8px', textAlign:'center', marginTop:0}}>Sign Up</h2>
        <p style={{color:'#6b7280', textAlign:'center', marginBottom:'32px', fontSize:'15px', marginTop:0}}>Create your MentorMatch account.</p>
        {errors.non_field_errors && <div className="error-banner">{errors.non_field_errors.join('\n')}</div>}
        <form onSubmit={submit}>
          {/* controlled inputs with inline error display */}
          <input className={errors.username? 'input-error':''} placeholder="Username" value={form.username} onChange={e=>setForm({...form, username:e.target.value})} />
          {errors.username && <div className="error-text">{errors.username.join(', ')}</div>}
          <input className={errors.email? 'input-error':''} placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          {errors.email && <div className="error-text">{errors.email.join(', ')}</div>}
          <input type="password" className={errors.password? 'input-error':''} placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
          {errors.password && <div className="error-text">{errors.password.join(', ')}</div>}
          <input type="password" className={errors.password2? 'input-error':''} placeholder="Confirm password" value={form.password2} onChange={e=>setForm({...form, password2:e.target.value})} />
          {errors.password2 && <div className="error-text">{errors.password2.join(', ')}</div>}
          <select className={errors.role? 'input-error':''} value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
            <option value="">Select role</option>
            <option value="student">Student</option>
            <option value="professional">Professional</option>
          </select>
          {errors.role && <div className="error-text">{errors.role.join(', ')}</div>}
          <button className="btn" style={{width:'100%', marginTop:'8px', padding:'16px', fontSize:'16px', fontWeight:'600'}}>Create account</button>
        </form>
      </div>
    </div>
  )
}
