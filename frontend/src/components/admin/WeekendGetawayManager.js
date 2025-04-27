import React, { useState, useEffect } from 'react';
import { getTreks, toggleWeekendGetaway } from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaPlus, FaMinus, FaUmbrellaBeach, FaCheck, FaTimes, FaEdit, FaEye } from 'react-icons/fa';
import Modal from '../Modal';
import { Link } from 'react-router-dom';

function WeekendGetawayManager() {
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekendGetaways, setWeekendGetaways] = useState([]);
  const [regularTreks, setRegularTreks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTrek, setSelectedTrek] = useState(null);
  const [formData, setFormData] = useState({
    weekendHighlights: [],
    transportation: '',
    departureTime: '',
    returnTime: '',
    meetingPoint: ''
  });
  const [newHighlight, setNewHighlight] = useState('');
  
  useEffect(() => {
    fetchTreks();
  }, []);
  
  const fetchTreks = async () => {
    setLoading(true);
    try {
      const data = await getTreks();
      setTreks(data);
      
      // Separate weekend getaways from regular treks
      const weekendTreks = data.filter(trek => trek.isWeekendGetaway);
      const otherTreks = data.filter(trek => !trek.isWeekendGetaway);
      
      setWeekendGetaways(weekendTreks);
      setRegularTreks(otherTreks);
    } catch (error) {
      console.error('Error fetching treks:', error);
      toast.error('Failed to load treks');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddToWeekendGetaways = (trek) => {
    setSelectedTrek(trek);
    setFormData({
      weekendHighlights: trek.weekendHighlights || [],
      transportation: trek.transportation || '',
      departureTime: trek.departureTime || '',
      returnTime: trek.returnTime || '',
      meetingPoint: trek.meetingPoint || ''
    });
    setShowAddModal(true);
  };
  
  const handleEditWeekendGetaway = (trek) => {
    setSelectedTrek(trek);
    setFormData({
      weekendHighlights: trek.weekendHighlights || [],
      transportation: trek.transportation || '',
      departureTime: trek.departureTime || '',
      returnTime: trek.returnTime || '',
      meetingPoint: trek.meetingPoint || ''
    });
    setShowEditModal(true);
  };
  
  const handleRemoveFromWeekendGetaways = async (trekId) => {
    try {
      await toggleWeekendGetaway(trekId, { isWeekendGetaway: false });
      toast.success('Trek removed from weekend getaways');
      fetchTreks();
    } catch (error) {
      console.error('Error removing trek from weekend getaways:', error);
      toast.error('Failed to remove trek from weekend getaways');
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const addHighlight = () => {
    if (newHighlight.trim()) {
      setFormData({
        ...formData,
        weekendHighlights: [...formData.weekendHighlights, newHighlight.trim()]
      });
      setNewHighlight('');
    }
  };
  
  const removeHighlight = (index) => {
    const newHighlights = [...formData.weekendHighlights];
    newHighlights.splice(index, 1);
    setFormData({ ...formData, weekendHighlights: newHighlights });
  };
  
  const handleSaveWeekendGetaway = async (isAdd = true) => {
    if (!selectedTrek) return;
    
    try {
      console.log('Saving weekend getaway for trek:', selectedTrek._id);
      console.log('Form data:', formData);
      
      await toggleWeekendGetaway(selectedTrek._id, {
        isWeekendGetaway: true,
        ...formData
      });
      
      toast.success(`Trek ${isAdd ? 'added to' : 'updated in'} weekend getaways`);
      setShowAddModal(false);
      setShowEditModal(false);
      fetchTreks();
    } catch (error) {
      console.error('Error saving weekend getaway:', error);
      toast.error(`Failed to save weekend getaway: ${error.message}`);
    }
  };
  
  const isShortDuration = (trek) => {
    return trek.duration <= 3; // Consider treks of 3 days or less as good for weekend getaways
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaUmbrellaBeach className="mr-2 text-emerald-600" />
          Weekend Getaway Manager
        </h2>
        <p className="text-gray-600 mt-1">
          Manage which treks are featured as weekend getaways on the website.
        </p>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="spinner"></div>
          <p className="mt-3 text-gray-600">Loading treks...</p>
        </div>
      ) : (
        <>
          {/* Current Weekend Getaways */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Current Weekend Getaways</h3>
            
            {weekendGetaways.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No weekend getaways configured yet.</p>
                <p className="text-sm text-gray-500 mt-1">Add treks from the list below.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trek</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transportation</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weekendGetaways.map(trek => (
                      <tr key={trek._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={trek.imageUrl} 
                                alt={trek.name} 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{trek.name}</div>
                              <div className="text-sm text-gray-500">{trek.difficulty}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {trek.region?.name || 'No region'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{trek.duration} days</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{trek.transportation || 'Not specified'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditWeekendGetaway(trek)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit weekend getaway details"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleRemoveFromWeekendGetaways(trek._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove from weekend getaways"
                            >
                              <FaMinus />
                            </button>
                            <Link
                              to={`/treks/${trek._id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="View trek"
                              target="_blank"
                            >
                              <FaEye />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Available Treks */}
          <div>
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Available Treks</h3>
            
            {regularTreks.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No regular treks available.</p>
                <Link to="/admin/treks/new" className="text-emerald-600 hover:underline">Create a new trek</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trek</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suitable</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {regularTreks.map(trek => (
                      <tr key={trek._id} className={isShortDuration(trek) ? 'bg-green-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={trek.imageUrl} 
                                alt={trek.name} 
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{trek.name}</div>
                              <div className="text-sm text-gray-500">{trek.difficulty}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {trek.region?.name || 'No region'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{trek.duration} days</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isShortDuration(trek) ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <FaCheck className="mr-1" /> Good fit
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              <FaTimes className="mr-1" /> Too long
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleAddToWeekendGetaways(trek)}
                            className="text-emerald-600 hover:text-emerald-900 flex items-center"
                          >
                            <FaPlus className="mr-1" /> Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Add to Weekend Getaways Modal */}
      {showAddModal && selectedTrek && (
        <Modal 
          title={`Add ${selectedTrek.name} to Weekend Getaways`}
          onClose={() => setShowAddModal(false)}
          size="large"
        >
          <div className="p-4">
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Configure the weekend getaway details for this trek. These details will help travelers plan their weekend escape.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transportation
                  </label>
                  <input
                    type="text"
                    name="transportation"
                    value={formData.transportation}
                    onChange={handleInputChange}
                    placeholder="e.g., Shared taxi from city center"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Point
                  </label>
                  <input
                    type="text"
                    name="meetingPoint"
                    value={formData.meetingPoint}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Bus Terminal"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departure Time
                  </label>
                  <input
                    type="text"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleInputChange}
                    placeholder="e.g., 7:00 AM Friday"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Time
                  </label>
                  <input
                    type="text"
                    name="returnTime"
                    value={formData.returnTime}
                    onChange={handleInputChange}
                    placeholder="e.g., 6:00 PM Sunday"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekend Highlights
              </label>
              
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="Add a weekend highlight"
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={addHighlight}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md"
                >
                  Add
                </button>
              </div>
              
              <div className="space-y-2 mt-3">
                {formData.weekendHighlights.map((highlight, index) => (
                  <div key={index} className="flex justify-between bg-gray-50 p-2 rounded">
                    <span>{highlight}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(index)}
                      className="text-red-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
                
                {formData.weekendHighlights.length === 0 && (
                  <p className="text-gray-400 text-sm">No highlights added yet</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={() => handleSaveWeekendGetaway(true)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
              >
                Add to Weekend Getaways
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Edit Weekend Getaway Modal */}
      {showEditModal && selectedTrek && (
        <Modal 
          title={`Edit ${selectedTrek.name} Weekend Getaway Details`}
          onClose={() => setShowEditModal(false)}
          size="large"
        >
          <div className="p-4">
            {/* Same form content as Add Modal */}
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Update the weekend getaway details for this trek.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transportation
                  </label>
                  <input
                    type="text"
                    name="transportation"
                    value={formData.transportation}
                    onChange={handleInputChange}
                    placeholder="e.g., Shared taxi from city center"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Point
                  </label>
                  <input
                    type="text"
                    name="meetingPoint"
                    value={formData.meetingPoint}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Bus Terminal"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departure Time
                  </label>
                  <input
                    type="text"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleInputChange}
                    placeholder="e.g., 7:00 AM Friday"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Time
                  </label>
                  <input
                    type="text"
                    name="returnTime"
                    value={formData.returnTime}
                    onChange={handleInputChange}
                    placeholder="e.g., 6:00 PM Sunday"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekend Highlights
              </label>
              
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="Add a weekend highlight"
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={addHighlight}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md"
                >
                  Add
                </button>
              </div>
              
              <div className="space-y-2 mt-3">
                {formData.weekendHighlights.map((highlight, index) => (
                  <div key={index} className="flex justify-between bg-gray-50 p-2 rounded">
                    <span>{highlight}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(index)}
                      className="text-red-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={() => handleSaveWeekendGetaway(false)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
              >
                Update Weekend Getaway
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default WeekendGetawayManager; 