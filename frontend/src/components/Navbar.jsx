import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
      <Link to="/" className="text-xl font-bold tracking-wide">RentEase</Link>
      <div className="space-x-6">
        {user ? (
          <>
            <span className="font-semibold">Hi, {user.name}</span>
            <Link to="/dashboard" className="hover:text-gray-200 transition">Dashboard</Link>
            <button 
              onClick={logout} 
              className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-gray-200 transition">Login</Link>
            <Link to="/register" className="hover:text-gray-200 transition">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}