import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
      alert('Login Successful!');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 border p-6 rounded shadow-lg bg-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input 
            type="email" 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input 
            type="password" 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          Login
        </button>
      </form>
    </div>
  );
}