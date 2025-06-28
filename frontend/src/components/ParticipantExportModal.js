import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { exportBatchParticipants } from '../services/api';

const ParticipantExportModal = ({ isOpen, onClose, trekId, batchId, trekData }) => {
  const [selectedFields, setSelectedFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasBeenCleared, setHasBeenCleared] = useState(false);

  // Define available fields
  const availableFields = [
    { key: 'participantName', label: 'Participant Name', category: 'Participant Details' },
    { key: 'participantAge', label: 'Age', category: 'Participant Details' },
    { key: 'participantGender', label: 'Gender', category: 'Participant Details' },
    { key: 'participantPhone', label: 'Contact Number', category: 'Participant Details' },
    { key: 'emergencyContactName', label: 'Emergency Contact Name', category: 'Emergency Contact' },
    { key: 'emergencyContactPhone', label: 'Emergency Contact Phone', category: 'Emergency Contact' },
    { key: 'emergencyContactRelation', label: 'Emergency Contact Relation', category: 'Emergency Contact' },
    { key: 'medicalConditions', label: 'Medical Conditions', category: 'Health & Safety' },
    { key: 'specialRequests', label: 'Special Requests', category: 'Health & Safety' },
    { key: 'bookingUserName', label: 'Booking User Name', category: 'Booking Information' },
    { key: 'bookingUserEmail', label: 'Booking User Email', category: 'Booking Information' },
    { key: 'bookingUserPhone', label: 'Booking User Phone', category: 'Booking Information' },
    { key: 'bookingDate', label: 'Booking Date', category: 'Booking Information' },
    { key: 'bookingStatus', label: 'Booking Status', category: 'Booking Information' },
    { key: 'totalPrice', label: 'Total Price', category: 'Booking Information' },
    { key: 'pickupLocation', label: 'Pickup Location', category: 'Logistics' },
    { key: 'dropLocation', label: 'Drop Location', category: 'Logistics' },
    { key: 'additionalRequests', label: 'Additional Requests', category: 'Logistics' }
  ];

  // Use useMemo to prevent recreation of allFields on every render
  const allFields = useMemo(() => {
    const fields = [...availableFields];
    if (trekData?.customFields && Array.isArray(trekData.customFields)) {
      trekData.customFields.forEach(field => {
        fields.push({
          key: `custom_${field.key}`,
          label: field.label || field.key,
          category: 'Custom Fields',
          fieldType: field.type
        });
      });
    }
    return fields;
  }, [trekData?.customFields]);

  // Group fields by category
  const groupedFields = useMemo(() => {
    return allFields.reduce((acc, field) => {
      if (!acc[field.category]) {
        acc[field.category] = [];
      }
      acc[field.category].push(field);
      return acc;
    }, {});
  }, [allFields]);

  useEffect(() => {
    // Only set default fields when modal opens and no fields are selected and hasn't been manually cleared
    if (isOpen && selectedFields.length === 0 && !hasBeenCleared) {
      setSelectedFields(allFields.slice(0, 10).map(field => field.key));
    }
  }, [isOpen, allFields, selectedFields.length, hasBeenCleared]);

  // Reset the cleared flag when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasBeenCleared(false);
    }
  }, [isOpen]);

  const handleFieldToggle = (fieldKey) => {
    setSelectedFields(prev => {
      const newSelection = prev.includes(fieldKey) 
        ? prev.filter(key => key !== fieldKey)
        : prev.length < 10 
          ? [...prev, fieldKey]
          : prev;
      
      if (prev.length >= 10 && !prev.includes(fieldKey)) {
        toast.error('Maximum 10 fields allowed');
      }
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    const firstTen = allFields.slice(0, 10).map(field => field.key);
    setSelectedFields(firstTen);
    setHasBeenCleared(false); // Reset the cleared flag
  };

  const handleClearAll = () => {
    setSelectedFields([]);
    setHasBeenCleared(true); // Mark as manually cleared
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    try {
      setLoading(true);
      const response = await exportBatchParticipants(trekId, batchId, selectedFields);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch-participants-${trekData?.name || 'trek'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF exported successfully!');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Export Participant Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-3">
              Select up to 10 fields to include in the PDF export. Currently selected: <span className="font-semibold text-emerald-600">{selectedFields.length}/10</span>
            </p>
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
              >
                Select First 10
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedFields).map(([category, fields]) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">{category}</h3>
                <div className="space-y-3">
                  {fields.map(field => (
                    <label key={field.key} className="flex items-center space-x-3 cursor-pointer hover:bg-white hover:shadow-sm rounded p-2 transition-all">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.key)}
                        onChange={() => handleFieldToggle(field.key)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 flex-1">
                        {field.label}
                        {field.fieldType && (
                          <span className="text-xs text-gray-500 ml-1">({field.fieldType})</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading || selectedFields.length === 0}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantExportModal; 