import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Home() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get('/equipment').then(res => setItems(res.data));
  }, []);

  const handleSearch = () => {
    api.get(`/equipment?search=${search}`).then(res => setItems(res.data));
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <input 
          className="border p-3 flex-1 rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="Search cameras, tools, laptops..." 
          onChange={e => setSearch(e.target.value)} 
        />
        <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded font-bold transition">
          Search
        </button>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.equipment_id} className="border p-4 rounded-lg hover:shadow-xl transition relative bg-white">
            {/* Availability Badge */}
            <span className={`absolute top-2 right-2 px-3 py-1 text-xs font-bold text-white rounded-full ${item.is_available ? 'bg-green-500' : 'bg-red-500'}`}>
              {item.is_available ? 'AVAILABLE' : 'UNAVAILABLE'}
            </span>

            <h3 className="font-bold text-xl mb-1">{item.name}</h3>
            <p className="text-gray-600 mb-2">{item.category}</p>
            <p className="text-blue-600 font-bold text-lg mb-4">${item.price_per_day} <span className="text-sm text-gray-500 font-normal">/ day</span></p>
            
            {/* Action Button */}
            {item.is_available ? (
                <Link to={`/equipment/${item.equipment_id}`} className="block mt-2 text-center bg-gray-100 hover:bg-gray-200 py-2 rounded text-blue-800 font-semibold transition">
                  View Details
                </Link>
            ) : (
                <button disabled className="block mt-2 w-full text-center bg-gray-50 text-gray-400 py-2 rounded cursor-not-allowed border">
                  Currently Unavailable
                </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}