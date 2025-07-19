import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrekByIdForAdmin, createTrek, updateTrek, getRegions } from '../services/api';
import { toast } from 'react-toastify';

function TrekForm(props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region: '',
    season: 'Summer',
    duration: 1,
    difficulty: 'Moderate',
    maxAltitude: 0,
    distance: 0,
    imageUrl: '',
    startingPoint: '',
    endingPoint: '',
    highlights: [],
    bestTimeToVisit: '',
    price: 0,
    isCustom: false
  });
  const [regions, setRegions] = useState([]);
  const [customAccessUrl, setCustomAccessUrl] = useState('');

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      const fetchTrek = async () => {
        try {
          setLoading(true);
          const data = await getTrekByIdForAdmin(id);
          setFormData(data);
        } catch (err) {
          console.error('Error fetching trek details:', err);
          setError('Failed to load trek details. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      fetchTrek();
    }
  }, [id, isEditMode]);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const data = await getRegions();
        setRegions(data);
      } catch (err) {
        console.error('Error fetching regions:', err);
      }
    };
    
    fetchRegions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleHighlightsChange = (e) => {
    const highlights = e.target.value.split('\n').filter(item => item.trim() !== '');
    setFormData(prev => ({
      ...prev,
      highlights
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      if (isEditMode) {
        await updateTrek(id, formData);
        toast.success('Trek updated successfully!');
      } else {
        const response = await createTrek(formData);
        toast.success('Trek created successfully!');
        
        // If it's a custom trek, show the access URL
        if (response.isCustom && response.customAccessUrl) {
          setCustomAccessUrl(response.customAccessUrl);
          toast.info('Custom trek created! Share this link with your customer: ' + response.customAccessUrl);
        }
      }
      
      // Call the onSuccess callback if provided
      if (props.onSuccess) {
        await props.onSuccess();
      }
      
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving trek:', err);
      
      // Handle specific field errors
      if (err.response?.data?.field === 'name') {
        setError(err.response.data.message);
        // Focus on the name field
        const nameInput = document.getElementById('name');
        if (nameInput) {
          nameInput.focus();
        }
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to save trek. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edit Trek' : 'Add New Trek'}
      </h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Trek Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="region" className="form-label">Region</label>
            <select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select a region</option>
              {regions.map(region => (
                <option key={region._id} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty *
            </label>
            <select
              id="difficulty"
              name="difficulty"
              required
              value={formData.difficulty}
              onChange={handleChange}
              className="form-input"
            >
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Difficult">Difficult</option>
              <option value="Very Difficult">Very Difficult</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1">
              Season *
            </label>
            <select
              id="season"
              name="season"
              required
              value={formData.season}
              onChange={handleChange}
              className="form-input"
            >
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Autumn">Autumn</option>
              <option value="Winter">Winter</option>
              <option value="All Year">All Year</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (days) *
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              min="1"
              required
              value={formData.duration}
              onChange={handleNumberChange}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-1">
              Distance (km) *
            </label>
            <input
              type="number"
              id="distance"
              name="distance"
              min="0"
              step="0.1"
              required
              value={formData.distance}
              onChange={handleNumberChange}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="maxAltitude" className="block text-sm font-medium text-gray-700 mb-1">
              Max Altitude (m) *
            </label>
            <input
              type="number"
              id="maxAltitude"
              name="maxAltitude"
              min="0"
              required
              value={formData.maxAltitude}
              onChange={handleNumberChange}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="form-input"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div>
            <label htmlFor="startingPoint" className="block text-sm font-medium text-gray-700 mb-1">
              Starting Point *
            </label>
            <input
              type="text"
              id="startingPoint"
              name="startingPoint"
              required
              value={formData.startingPoint}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="endingPoint" className="block text-sm font-medium text-gray-700 mb-1">
              Ending Point *
            </label>
            <input
              type="text"
              id="endingPoint"
              name="endingPoint"
              required
              value={formData.endingPoint}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="bestTimeToVisit" className="block text-sm font-medium text-gray-700 mb-1">
              Best Time to Visit
            </label>
            <input
              type="text"
              id="bestTimeToVisit"
              name="bestTimeToVisit"
              value={formData.bestTimeToVisit}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., March to May, September to November"
            />
          </div>
          
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price (INR)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              placeholder="Enter price in INR"
              value={formData.price}
              onChange={handleNumberChange}
              className="form-input"
            />
          </div>
          
          {/* Custom Trek Toggle */}
          <div className="md:col-span-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isCustom"
                name="isCustom"
                checked={formData.isCustom}
                onChange={(e) => setFormData(prev => ({ ...prev, isCustom: e.target.checked }))}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="isCustom" className="ml-2 block text-sm text-gray-900">
                This is a custom trek (private booking only)
              </label>
            </div>
            {formData.isCustom && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Custom Trek Features:</strong>
                  <br />• Hidden from public listings
                  <br />• 2-week expiration date
                  <br />• Simplified booking process
                  <br />• Direct confirmation after booking
                  <br />• Single custom batch
                </p>
              </div>
            )}
          </div>
          
          {/* Custom Access URL Display */}
          {customAccessUrl && (
            <div className="md:col-span-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <label className="block text-sm font-medium text-green-800 mb-1">
                  Custom Trek Access URL:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customAccessUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-green-300 rounded-md bg-white text-green-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(customAccessUrl);
                      toast.success('URL copied to clipboard!');
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            rows="4"
            required
            value={formData.description}
            onChange={handleChange}
            className="form-input"
          ></textarea>
        </div>
        
        <div className="mt-6">
          <label htmlFor="highlights" className="block text-sm font-medium text-gray-700 mb-1">
            Highlights (one per line)
          </label>
          <textarea
            id="highlights"
            name="highlights"
            rows="4"
            value={formData.highlights.join('\n')}
            onChange={handleHighlightsChange}
            className="form-input"
            placeholder="Beautiful mountain views&#10;Pristine lakes&#10;Local villages"
          ></textarea>
        </div>
        
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              isEditMode ? 'Update Trek' : 'Create Trek'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TrekForm; 