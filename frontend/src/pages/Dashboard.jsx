import { useEffect, useState } from 'react';
import api from '../api';

export default function Dashboard({ user }) {
  const [myRentals, setMyRentals] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myEquipment, setMyEquipment] = useState([]);
  
  // State for the "List New Item" form
  const [newItem, setNewItem] = useState({ 
    name: '', 
    category: '', 
    price_per_day: 0, 
    description: '', 
    condition: 'Good',
    image_url: '' // Added Image URL field
  });

  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      // 1. Get rentals I made (as a Renter)
      const rentals = await api.get(`/rentals/my-requests/${user.user_id}`);
      setMyRentals(rentals.data);
      
      // 2. Get requests for my equipment (as an Owner)
      const requests = await api.get(`/rentals/owner-requests/${user.user_id}`);
      setIncomingRequests(requests.data);
      
      // 3. Get my listed equipment (filtered from all items)
      const equip = await api.get(`/equipment`); 
      setMyEquipment(equip.data.filter(e => e.owner_id === user.user_id));
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  // --- ACTIONS ---

  // 1. Create New Equipment
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/equipment?owner_id=${user.user_id}`, newItem);
      alert('Item listed successfully!');
      // Reset form
      setNewItem({ name: '', category: '', price_per_day: 0, description: '', condition: 'Good', image_url: '' }); 
      fetchData();
    } catch (err) {
      alert("Error creating item: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  // 2. Toggle Availability (Soft Delete / Hide)
  const toggleAvailability = async (id, currentStatus) => {
    try {
      await api.patch(`/equipment/${id}/availability`, { is_available: !currentStatus });
      fetchData();
    // eslint-disable-next-line no-unused-vars
    } catch (err) { 
      alert("Error updating status"); 
    }
  };

  // 3. Delete Equipment (Hard Delete)
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item? This cannot be undone.")) {
      try {
        await api.delete(`/equipment/${id}?owner_id=${user.user_id}`);
        alert("Item deleted successfully");
        fetchData();
      } catch (err) {
        alert(err.response?.data?.detail || "Could not delete item");
      }
    }
  };

  // 4. Edit Price
  const handleEditPrice = async (item) => {
    const newPrice = prompt(`Enter new price for ${item.name}:`, item.price_per_day);
    if (newPrice && newPrice !== item.price_per_day) {
      try {
        // Send all fields to PUT endpoint to update
        await api.put(`/equipment/${item.equipment_id}`, {
          name: item.name,
          category: item.category,
          description: item.description,
          condition: item.condition,
          image_url: item.image_url,
          price_per_day: parseInt(newPrice),
          is_available: item.is_available
        });
        alert("Price updated!");
        fetchData();
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        alert("Failed to update price");
      }
    }
  };

  // 5. Handle Rental Workflow (Approve, Reject, etc.)
  const handleStatus = async (id, action) => {
    try { 
      await api.put(`/rentals/${id}/${action}`); 
      fetchData(); 
    } catch (err) { 
      alert(err.response?.data?.detail || "Action failed"); 
    }
  };

  // --- RENDER ---

  return (
    <div className="space-y-10 pb-10">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      {/* SECTION 1: List New Equipment */}
      <div className="border p-6 rounded-lg shadow-md bg-white">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">List New Equipment</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Item Name" className="border p-2 rounded" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
          
          <input required placeholder="Category (e.g. Camera)" className="border p-2 rounded" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} />
          
          <input placeholder="Image URL (http://...)" className="border p-2 rounded" value={newItem.image_url} onChange={e => setNewItem({...newItem, image_url: e.target.value})} />

          <input required type="number" placeholder="Price Per Day" className="border p-2 rounded" value={newItem.price_per_day || ''} onChange={e => setNewItem({...newItem, price_per_day: e.target.value})} />
          
          <select className="border p-2 rounded" value={newItem.condition} onChange={e => setNewItem({...newItem, condition: e.target.value})}>
            <option>Good</option><option>New</option><option>Used</option>
          </select>
          
          <textarea required placeholder="Description" className="border p-2 rounded md:col-span-2" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
          
          <button className="bg-green-600 hover:bg-green-700 text-white p-2 md:col-span-2 rounded font-bold transition">List Item</button>
        </form>
      </div>

      {/* SECTION 2: My Equipment Management */}
      <div className="border p-6 rounded-lg shadow-md bg-white">
         <h2 className="text-xl font-bold mb-4 border-b pb-2">My Equipment Management</h2>
         {myEquipment.length === 0 ? <p className="text-gray-500">You haven't listed any items.</p> : (
           <div className="space-y-3">
             {myEquipment.map(e => (
               <div key={e.equipment_id} className="flex flex-col md:flex-row justify-between items-center border-b pb-3 last:border-0 gap-3 md:gap-0">
                 
                 {/* Item Info */}
                 <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${e.is_available ? 'bg-green-500' : 'bg-red-500'}`} title={e.is_available ? "Available" : "Unavailable"}></span>
                    <div>
                      <span className="font-medium block">{e.name}</span>
                      <span className="text-sm text-gray-500">Rent: ${e.price_per_day}/day</span>
                    </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                    <button 
                      onClick={() => handleEditPrice(e)} 
                      className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded border border-blue-200 transition"
                    >
                      Edit Price
                    </button>
                    
                    <button 
                      onClick={() => toggleAvailability(e.equipment_id, e.is_available)} 
                      className="text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded border transition"
                    >
                      {e.is_available ? 'Set Unavailable' : 'Set Available'}
                    </button>

                    <button 
                      onClick={() => handleDelete(e.equipment_id)} 
                      className="text-sm bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded border border-red-200 transition"
                    >
                      Delete
                    </button>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>

      {/* SECTION 3: Incoming Rental Requests (Owner View) */}
      <div className="border p-6 rounded-lg shadow-md bg-gray-50">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Incoming Requests (As Owner)</h2>
        {incomingRequests.length === 0 ? <p className="text-gray-500">No requests received.</p> : (
          incomingRequests.map(r => (
            <div key={r.rental_id} className="flex flex-col md:flex-row justify-between items-center bg-white p-3 mb-2 rounded border shadow-sm gap-3">
              <div className="w-full md:w-auto">
                <p className="font-semibold">Rental #{r.rental_id} for Item #{r.equipment_id}</p> 
                <p className="text-sm text-gray-600">{r.start_date} to {r.end_date} | Total: ${r.total_cost}</p>
                <p className="text-sm">Status: <strong className={`uppercase ${r.status === 'pending' ? 'text-yellow-600' : 'text-blue-600'}`}>{r.status}</strong></p>
              </div>
              <div className="flex gap-2 w-full md:w-auto justify-end">
                {r.status === 'pending' && (
                  <>
                    <button onClick={() => handleStatus(r.rental_id, 'approve')} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition">Approve</button>
                    <button onClick={() => handleStatus(r.rental_id, 'reject')} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">Reject</button>
                  </>
                )}
                {r.status === 'approved' && <button onClick={() => handleStatus(r.rental_id, 'pickup')} className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition">Mark Rented (Pickup)</button>}
                {r.status === 'return_requested' && <button onClick={() => handleStatus(r.rental_id, 'confirm-return')} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition">Confirm Return</button>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* SECTION 4: My Rentals (Renter View) */}
      <div className="border p-6 rounded-lg shadow-md bg-white">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">My Rentals (As Renter)</h2>
        {myRentals.length === 0 ? <p className="text-gray-500">You haven't rented anything yet.</p> : (
          myRentals.map(r => (
            <div key={r.rental_id} className="flex justify-between items-center border-b py-3 last:border-0">
              <div>
                <p className="font-medium">Item #{r.equipment_id} ({r.start_date} to {r.end_date})</p>
                <p className="text-sm text-gray-600">Status: <strong className="uppercase">{r.status}</strong></p>
              </div>
              {r.status === 'rented' && (
                 <button onClick={() => handleStatus(r.rental_id, 'return-request')} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition">Request Return</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}