import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      alert('Registration Successful! Please login.');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 border p-6 rounded shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Full Name</label>
          <input 
            type="text" 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input 
            type="email" 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input 
            type="password" 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          Register
        </button>
      </form>
    </div>
  );
}