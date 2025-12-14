import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function EquipmentDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [dates, setDates] = useState({ start: '', end: '' });

  useEffect(() => {
    api.get(`/equipment/${id}`).then(res => setItem(res.data));
  }, [id]);

  const handleRent = async () => {
    if (!user) return alert("Please login first");
    try {
      await api.post('/rentals/request', {
        equipment_id: parseInt(id),
        renter_id: user.user_id,
        start_date: dates.start,
        end_date: dates.end
      });
      alert('Request Sent Successfully!');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.detail || "Error sending request");
    }
  };

  if (!item) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto border rounded-lg shadow-lg bg-white mt-10 overflow-hidden">
      
      {/* --- NEW: LARGE IMAGE HEADER --- */}
      <img 
        src={item.image_url || "https://via.placeholder.com/800x400?text=No+Image"} 
        alt={item.name} 
        className="w-full h-64 object-cover"
        onError={(e) => { e.target.src = "https://via.placeholder.com/800x400?text=Error"; }}
      />

      <div className="p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-gray-800">{item.name}</h1>
            <p className="text-gray-500 text-lg mb-4">{item.category} • Condition: {item.condition}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-bold text-white rounded-full ${item.is_available ? 'bg-green-500' : 'bg-red-500'}`}>
             {item.is_available ? 'Available' : 'Unavailable'}
          </span>
        </div>

        <p className="mb-6 text-gray-700 leading-relaxed border-t border-b py-4">{item.description}</p>
        
        <p className="text-3xl font-bold text-blue-600 mb-8">${item.price_per_day} <span className="text-lg text-gray-500 font-normal">/ day</span></p>
        
        {user && user.user_id !== item.owner_id ? (
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="font-bold text-lg mb-4">Select Rental Dates</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">Start Date</label>
                  <input type="date" className="w-full border p-2 rounded" onChange={e => setDates({...dates, start: e.target.value})} />
              </div>
              <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">End Date</label>
                  <input type="date" className="w-full border p-2 rounded" onChange={e => setDates({...dates, end: e.target.value})} />
              </div>
            </div>
            <button onClick={handleRent} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded w-full font-bold transition shadow-lg">
              Send Rental Request
            </button>
          </div>
        ) : (
          !user ? (
              <p className="text-red-500 font-medium">Please <a href="/login" className="underline">login</a> to rent this item.</p>
          ) : (
              <p className="text-gray-500 italic">You own this item.</p>
          )
        )}
      </div>
    </div>
  );
}