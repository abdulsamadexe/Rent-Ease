import { useEffect, useState } from 'react';
import api from '../api';

export default function Dashboard({ user }) {
  const [myRentals, setMyRentals] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myEquipment, setMyEquipment] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', category: '', price_per_day: 0, description: '', condition: 'Good' });

  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    // 1. Get rentals I made (as a Renter)
    const rentals = await api.get(`/rentals/my-requests/${user.user_id}`);
    setMyRentals(rentals.data);
    
    // 2. Get requests for my equipment (as an Owner)
    const requests = await api.get(`/rentals/owner-requests/${user.user_id}`);
    setIncomingRequests(requests.data);
    
    // 3. Get my listed equipment
    const equip = await api.get(`/equipment`); 
    setMyEquipment(equip.data.filter(e => e.owner_id === user.user_id));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/equipment?owner_id=${user.user_id}`, newItem);
      alert('Item listed successfully!');
      setNewItem({ name: '', category: '', price_per_day: 0, description: '', condition: 'Good' }); // Reset form
      fetchData();
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Error creating item");
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      await api.patch(`/equipment/${id}/availability`, { is_available: !currentStatus });
      fetchData();
    // eslint-disable-next-line no-unused-vars
    } catch (err) { alert("Error updating status"); }
  };

  const handleStatus = async (id, action) => {
    try { await api.put(`/rentals/${id}/${action}`); fetchData(); } 
    catch (err) { alert(err.response?.data?.detail); }
  };

  return (
    <div className="space-y-10 pb-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* SECTION 1: List New Equipment */}
      <div className="border p-6 rounded-lg shadow-md bg-white">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">List New Equipment</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Item Name" className="border p-2 rounded" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
          <input required placeholder="Category (e.g. Camera)" className="border p-2 rounded" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} />
          <input required type="number" placeholder="Price Per Day" className="border p-2 rounded" value={newItem.price_per_day} onChange={e => setNewItem({...newItem, price_per_day: e.target.value})} />
          <select className="border p-2 rounded" value={newItem.condition} onChange={e => setNewItem({...newItem, condition: e.target.value})}>
            <option>Good</option><option>New</option><option>Used</option>
          </select>
          <textarea required placeholder="Description" className="border p-2 rounded md:col-span-2" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
          <button className="bg-green-600 hover:bg-green-700 text-white p-2 md:col-span-2 rounded font-bold transition">List Item</button>
        </form>
      </div>

      {/* SECTION 2: My Equipment List */}
      <div className="border p-6 rounded-lg shadow-md bg-white">
         <h2 className="text-xl font-bold mb-4 border-b pb-2">My Equipment Management</h2>
         {myEquipment.length === 0 ? <p className="text-gray-500">You haven't listed any items.</p> : (
           <div className="space-y-2">
             {myEquipment.map(e => (
               <div key={e.equipment_id} className="flex justify-between items-center border-b py-2 last:border-0">
                 <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${e.is_available ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">{e.name}</span>
                 </div>
                 <button onClick={() => toggleAvailability(e.equipment_id, e.is_available)} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded border">
                   {e.is_available ? 'Set Unavailable' : 'Set Available'}
                 </button>
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
            <div key={r.rental_id} className="flex flex-col md:flex-row justify-between items-center bg-white p-3 mb-2 rounded border shadow-sm">
              <div className="mb-2 md:mb-0">
                <p className="font-semibold">Rental #{r.rental_id} for Item #{r.equipment_id}</p> 
                <p className="text-sm text-gray-600">{r.start_date} to {r.end_date} | Total: ${r.total_cost}</p>
                <p className="text-sm">Status: <strong className="uppercase text-blue-600">{r.status}</strong></p>
              </div>
              <div className="space-x-2">
                {r.status === 'pending' && (
                  <>
                    <button onClick={() => handleStatus(r.rental_id, 'approve')} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Approve</button>
                    <button onClick={() => handleStatus(r.rental_id, 'reject')} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Reject</button>
                  </>
                )}
                {r.status === 'approved' && <button onClick={() => handleStatus(r.rental_id, 'pickup')} className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600">Mark Rented (Pickup)</button>}
                {r.status === 'return_requested' && <button onClick={() => handleStatus(r.rental_id, 'confirm-return')} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Confirm Return</button>}
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
                 <button onClick={() => handleStatus(r.rental_id, 'return-request')} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Request Return</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}