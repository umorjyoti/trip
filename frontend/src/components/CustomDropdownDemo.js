import React, { useState } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import CustomDropdown from './CustomDropdown';

const CustomDropdownDemo = () => {
  const [tripType, setTripType] = useState('Backpacking Trips');
  const [region, setRegion] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const tripOptions = [
    'Backpacking Trips',
    'Weekend Getaways',
    'Adventure Tours',
    'Cultural Tours',
    'Custom Tours'
  ];

  const regionOptions = [
    'Meghalaya',
    'Ladakh',
    'Spiti Valley',
    'Andaman Islands',
    'Karnataka',
    'Himachal Pradesh'
  ];

  const difficultyOptions = [
    'Easy',
    'Moderate',
    'Difficult',
    'Very Difficult'
  ];

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Custom Dropdown Demo</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trip Type *
          </label>
          <CustomDropdown
            options={tripOptions}
            value={tripType}
            onChange={setTripType}
            placeholder="Select trip type"
            required
            icon={FaCalendarAlt}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Region
          </label>
          <CustomDropdown
            options={regionOptions}
            value={region}
            onChange={setRegion}
            placeholder="Select region"
            icon={FaMapMarkerAlt}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <CustomDropdown
            options={difficultyOptions}
            value={difficulty}
            onChange={setDifficulty}
            placeholder="Select difficulty"
            icon={FaUser}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Disabled Dropdown
          </label>
          <CustomDropdown
            options={tripOptions}
            value=""
            onChange={() => {}}
            placeholder="This dropdown is disabled"
            disabled={true}
            icon={FaCalendarAlt}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dropdown with Error
          </label>
          <CustomDropdown
            options={tripOptions}
            value=""
            onChange={() => {}}
            placeholder="Select an option"
            error="This field is required"
            icon={FaCalendarAlt}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Selected Values:</h3>
        <div className="space-y-1 text-sm">
          <p><strong>Trip Type:</strong> {tripType}</p>
          <p><strong>Region:</strong> {region || 'Not selected'}</p>
          <p><strong>Difficulty:</strong> {difficulty || 'Not selected'}</p>
        </div>
      </div>
    </div>
  );
};

export default CustomDropdownDemo; 