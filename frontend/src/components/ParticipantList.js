import React from 'react';
import { FaTrash, FaUndo } from 'react-icons/fa';

function ParticipantList({ participants = [], onCancelParticipant, onRestoreParticipant }) {
  if (!participants || participants.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No participants found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {participants.map((participant) => (
        <div
          key={participant._id}
          className="bg-gray-50 p-4 rounded-lg"
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{participant.name}</h4>
              <p className="text-sm text-gray-600">
                Age: {participant.age}
              </p>
              <p className="text-sm text-gray-600">
                Gender: {participant.gender}
              </p>
              {participant.medicalConditions && (
                <p className="text-sm text-gray-600">
                  Medical Conditions: {participant.medicalConditions}
                </p>
              )}
            </div>
            {participant.isCancelled ? (
              <button
                onClick={() => onRestoreParticipant(participant._id)}
                className="text-emerald-600 hover:text-emerald-900 text-sm font-medium"
              >
                <FaUndo className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => onCancelParticipant(participant._id)}
                className="text-red-600 hover:text-red-900 text-sm font-medium"
              >
                <FaTrash className="h-4 w-4" />
              </button>
            )}
          </div>
          {participant.isCancelled && (
            <p className="text-xs text-gray-500 mt-2">
              Cancelled on:{" "}
              {new Date(participant.cancelledAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default ParticipantList; 