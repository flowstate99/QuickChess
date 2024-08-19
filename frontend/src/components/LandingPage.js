import React from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

const LandingPage = () => {
  return (
    <div className='container'>
      <h1>PLAY GOOD MOVES FUCKER</h1>
      <Link to="/signup">Sign Up</Link>
      <Link to="/login">Login</Link>
    </div>
  )
}

export default LandingPage