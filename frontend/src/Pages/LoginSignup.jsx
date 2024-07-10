import React, { useState } from 'react'
import './CSS/LoginSignup.css'

const LoginSignup = () => {

  const [state,setState] = useState("Login");
  const [formData,setFormData] = useState({
    username:"",
    password:"",
    email:"",
  })

  const changeHandler = (e) => {
    setFormData({...formData,[e.target.name]:e.target.value})
  }

  const login = async () => {
    console.log("Login Function Executed",formData);
    let responseData;
    await fetch('http://localhost:4000/login',{
      method:'POST',
      headers:{
        Accept:'application/form-data',
        'Content-Type':'application/json',
      },
      body: JSON.stringify(formData),
    }).then((response)=> response.json()).then((data)=>responseData=data)

    if(responseData.success) {
      localStorage.setItem('auth-token',responseData.token);
      window.location.replace("/");
    }
    else{
      alert(responseData.errors)
    }
  }

  const signup = async () => {
    console.log("Signup Function Executed",formData);
    let responseData;
    await fetch('http://localhost:4000/signup',{
      method:'POST',
      headers:{
        Accept:'application/form-data',
        'Content-Type':'application/json',
      },
      body: JSON.stringify(formData),
    }).then((response)=> response.json()).then((data)=>responseData=data)

    if(responseData.success) {
      localStorage.setItem('auth-token',responseData.token);
      window.location.replace("/");
    }
    else{
      alert(responseData.errors)
    }
  }

  return (
    <div className='loginsignup'>
      <div className="loginsignup-container">
        <h1>{state}</h1>
        <div className="loginsignup-fields">
          {state==="Sign Up"?<input name='username' value={formData.username} onChange={changeHandler} type="text" placeholder='Nama Anda' />:<></>}
          <input name='email' value={formData.email} onChange={changeHandler} type="email" placeholder='Email Anda' />
          <input name='password' value={formData.password} onChange={changeHandler} type="password" placeholder='Password Anda' />
        </div>
        <div className="loginsignup-agree">
          <input type="checkbox" name='' id='' />
          <p>Saya menyetujui <span>Syarat dan Ketentuan</span>, serta <span>Kebijakan Privasi</span> dari Shoppy</p>
        </div>
        <button onClick={()=>{state==="Login"?login():signup()}}>Masuk</button>
        {state==="Sign Up"?<p className="loginsignup-login">Sudah punya akun? <span onClick={()=>{setState("Login")}}>Masuk disini</span></p>: 
        <p className="loginsignup-login">Belum punya akun? <span onClick={()=>{setState("Sign Up")}}>Daftar disini</span></p>}
        
      </div>
    </div>
  )
}

export default LoginSignup
