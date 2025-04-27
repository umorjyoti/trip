import React from 'react';
import { FaClock } from 'react-icons/fa';

function ActivityCard({ activity }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {activity.image && (
        <img 
          src={activity.image} 
          alt={activity.name} 
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{activity.name}</h3>
        
        {activity.duration && (
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <FaClock className="mr-1" />
            <span>{activity.duration}</span>
          </div>
        )}
        
        <p className="mt-2 text-gray-600">{activity.description}</p>
        
        {activity.trekId && (
          <a 
            href={`/weekend-getaways/${activity.trekId}`}
            className="mt-3 inline-block text-emerald-600 hover:text-emerald-700 font-medium"
          >
            View in {activity.trekName}
          </a>
        )}
      </div>
    </div>
  );
}

export default ActivityCard; 