import React, { useState } from 'react';
import { updateBatch } from '../services/api';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { FaUsers, FaLock, FaEdit } from 'react-icons/fa';

function BatchStatusManager({ batch, trekId, onBatchUpdated }) {
  const [loading, setLoading] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reservedSlots, setReservedSlots] = useState(batch.reservedSlots || 0);
  const [maxParticipants, setMaxParticipants] = useState(batch.maxParticipants);

  const currentParticipants = batch.actualCurrentParticipants || batch.currentParticipants || 0;
  const batchReservedSlots = batch.reservedSlots || 0;
  const availableSlots = batch.maxParticipants - currentParticipants - batchReservedSlots;
  const isFull = availableSlots <= 0;
  
  // Check if batch was marked as full (reserved slots equals total available slots)
  // This means all available slots are reserved, which indicates "marked as full"
  const wasMarkedAsFull = batchReservedSlots === (batch.maxParticipants - currentParticipants);
  
  // Debug logging
  console.log('Batch Status Debug:', {
    batchId: batch._id,
    maxParticipants: batch.maxParticipants,
    currentParticipants,
    batchReservedSlots,
    availableSlots,
    isFull,
    wasMarkedAsFull,
    totalAvailable: batch.maxParticipants - currentParticipants
  });

  const handleMarkAsFull = async () => {
    if (isFull) {
      toast.error('Batch is already full');
      return;
    }

    setLoading(true);
    try {
      // Calculate how many slots need to be reserved to make the batch full
      const slotsToReserve = batch.maxParticipants - currentParticipants;
      await updateBatch(trekId, batch._id, {
        reservedSlots: slotsToReserve
      });
      
      // Update local state immediately
      setReservedSlots(slotsToReserve);
      
      toast.success('Batch marked as full');
      if (onBatchUpdated) {
        onBatchUpdated();
      }
    } catch (error) {
      console.error('Error marking batch as full:', error);
      toast.error('Failed to mark batch as full');
    } finally {
      setLoading(false);
    }
  };

  const handleUnmarkAsFull = async () => {
    console.log('Unmark as full called:', {
      wasMarkedAsFull,
      batchReservedSlots,
      maxParticipants: batch.maxParticipants,
      currentParticipants,
      totalAvailable: batch.maxParticipants - currentParticipants
    });

    if (!wasMarkedAsFull) {
      toast.error('Batch was not marked as full');
      return;
    }

    setLoading(true);
    try {
      // When unmarking as full, we want to remove all reserved slots
      // since "marked as full" means all available slots were reserved
      await updateBatch(trekId, batch._id, {
        reservedSlots: 0
      });
      
      // Update local state immediately
      setReservedSlots(0);
      
      console.log('Unmark as full successful - reserved slots set to 0');
      toast.success('Batch unmarked as full');
      if (onBatchUpdated) {
        onBatchUpdated();
      }
    } catch (error) {
      console.error('Error unmarking batch as full:', error);
      toast.error('Failed to unmark batch as full');
    } finally {
      setLoading(false);
    }
  };

  const handleReserveSlots = async () => {
    if (reservedSlots < 0 || reservedSlots > maxParticipants) {
      toast.error('Invalid number of reserved slots');
      return;
    }

    if (reservedSlots > (batch.maxParticipants - currentParticipants)) {
      toast.error('Cannot reserve more slots than available');
      return;
    }

    setLoading(true);
    try {
      await updateBatch(trekId, batch._id, {
        reservedSlots: reservedSlots
      });
      toast.success(`${reservedSlots} slots reserved successfully`);
      setShowReserveModal(false);
      if (onBatchUpdated) {
        onBatchUpdated();
      }
    } catch (error) {
      console.error('Error reserving slots:', error);
      toast.error('Failed to reserve slots');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMaxParticipants = async () => {
    if (maxParticipants < currentParticipants) {
      toast.error('Max participants cannot be less than current participants');
      return;
    }

    setLoading(true);
    try {
      await updateBatch(trekId, batch._id, {
        maxParticipants: maxParticipants
      });
      toast.success('Max participants updated successfully');
      setShowReserveModal(false);
      if (onBatchUpdated) {
        onBatchUpdated();
      }
    } catch (error) {
      console.error('Error updating max participants:', error);
      toast.error('Failed to update max participants');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Status Indicators */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <FaUsers className="text-gray-500" />
            <span className="text-gray-600">
              {currentParticipants} / {batch.maxParticipants}
            </span>
          </div>
          {isFull && (
            <div className="flex items-center gap-1 text-red-600">
              <FaLock className="text-xs" />
              <span className="font-semibold">FULL</span>
            </div>
          )}
        </div>

        {/* Available Slots */}
        <div className="text-xs text-gray-500">
          Total Available: <span className="font-semibold">{batch.maxParticipants - currentParticipants}</span>
          {batchReservedSlots > 0 && (
            <span className="text-orange-600 ml-1 font-semibold">
              ({batchReservedSlots} reserved)
            </span>
          )}
        </div>
        
        {/* Publicly Available Slots */}
        <div className="text-xs text-blue-600">
          Publicly Available: <span className="font-semibold">{availableSlots}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
          {!isFull ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMarkAsFull();
              }}
              disabled={loading}
              className={`flex-1 py-1 px-2 rounded text-xs font-medium disabled:opacity-50 ${
                availableSlots <= 2 
                  ? 'bg-red-200 text-red-800 hover:bg-red-300' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
              title="Mark batch as full"
            >
              {availableSlots <= 2 ? 'Mark Full!' : 'Mark Full'}
            </button>
          ) : wasMarkedAsFull ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUnmarkAsFull();
              }}
              disabled={loading}
              className="flex-1 py-1 px-2 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 disabled:opacity-50"
              title="Unmark batch as full"
            >
              Unmark Full
            </button>
          ) : (
            <div className="flex-1 py-1 px-2 bg-gray-100 text-gray-500 rounded text-xs font-medium">
              Full
            </div>
          )}
          
          {/* Only show Manage button if batch is not full */}
          {!isFull && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowReserveModal(true);
              }}
              disabled={loading}
              className="flex-1 py-1 px-2 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 disabled:opacity-50"
              title="Reserve slots or update max participants"
            >
              <FaEdit className="inline mr-1" />
              Manage
            </button>
          )}
        </div>
      </div>

      {/* Reserve Slots Modal */}
      <Modal
        isOpen={showReserveModal}
        onClose={() => setShowReserveModal(false)}
        title="Manage Batch Slots"
        footer={
          <>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => setShowReserveModal(false)}
            >
              Close
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Participants
            </label>
            <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
              {currentParticipants}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Participants
            </label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 0)}
              min={currentParticipants}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
            <button
              onClick={handleUpdateMaxParticipants}
              disabled={loading || maxParticipants === batch.maxParticipants}
              className="mt-2 w-full py-1 px-3 bg-emerald-100 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-200 disabled:opacity-50"
            >
              Update Max Participants
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reserved Slots
            </label>
            <input
              type="number"
              value={reservedSlots}
              onChange={(e) => setReservedSlots(parseInt(e.target.value) || 0)}
              min={0}
              max={maxParticipants - currentParticipants}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum: {maxParticipants - currentParticipants} slots
            </p>
            <button
              onClick={handleReserveSlots}
              disabled={loading || reservedSlots === batchReservedSlots}
              className="mt-2 w-full py-1 px-3 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 disabled:opacity-50"
            >
              Update Reserved Slots
            </button>
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Summary</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div>Current Participants: {currentParticipants}</div>
              <div>Max Participants: {maxParticipants}</div>
              <div>Total Available: {maxParticipants - currentParticipants}</div>
              <div>Reserved Slots: {reservedSlots}</div>
              <div>Publicly Available: {maxParticipants - currentParticipants - reservedSlots}</div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default BatchStatusManager; 