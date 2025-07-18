const Booking = require('../models/Booking');

/**
 * Recalculates the currentParticipants count for a batch based on actual bookings
 * @param {string} batchId - The batch ID
 * @param {string} trekId - The trek ID
 * @returns {Promise<number>} - The recalculated participant count
 */
const recalculateBatchParticipants = async (batchId, trekId) => {
  try {
    // Get all bookings for this batch
    const bookings = await Booking.find({
      trek: trekId,
      batch: batchId
    });

    // Calculate total active participants (non-cancelled)
    let totalActiveParticipants = 0;
    
    bookings.forEach(booking => {
      if (booking.status === 'confirmed') {
        // Count only non-cancelled participants
        const activeParticipants = booking.participantDetails ? 
          booking.participantDetails.filter(p => !p.isCancelled).length : 
          booking.numberOfParticipants || 0;
        totalActiveParticipants += activeParticipants;
      }
    });

    return totalActiveParticipants;
  } catch (error) {
    console.error('Error recalculating batch participants:', error);
    throw error;
  }
};

/**
 * Updates the currentParticipants field for a batch in the trek document
 * @param {string} trekId - The trek ID
 * @param {string} batchId - The batch ID
 * @returns {Promise<number>} - The updated participant count
 */
const updateBatchParticipantCount = async (trekId, batchId) => {
  try {
    const Trek = require('../models/Trek');
    
    // Recalculate the participant count
    const newCount = await recalculateBatchParticipants(batchId, trekId);
    
    // Update the batch's currentParticipants field
    const trek = await Trek.findById(trekId);
    if (!trek) {
      throw new Error('Trek not found');
    }
    
    const batch = trek.batches.id(batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }
    
    batch.currentParticipants = newCount;
    await trek.save();
    
    return newCount;
  } catch (error) {
    console.error('Error updating batch participant count:', error);
    throw error;
  }
};

module.exports = {
  recalculateBatchParticipants,
  updateBatchParticipantCount
}; 