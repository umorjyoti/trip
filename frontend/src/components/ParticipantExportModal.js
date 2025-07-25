import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import { exportBatchParticipants, getTrekByIdForAdmin } from '../services/api';
import { FaTimes } from 'react-icons/fa';

const ParticipantExportModal = ({ isOpen, onClose, trekId, batchId, trekData }) => {
  const [selectedFields, setSelectedFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasBeenCleared, setHasBeenCleared] = useState(false);
  const [localTrekData, setLocalTrekData] = useState(trekData);
  const [fetchingTrekData, setFetchingTrekData] = useState(false);
  const [fileType, setFileType] = useState('pdf'); // Add file type state

  // Fetch trek data if not provided or if customFields are missing
  useEffect(() => {
    const fetchTrekData = async () => {
      if (!trekId) return;
      
      // If trekData doesn't have customFields, fetch it
      if (!trekData?.customFields || !Array.isArray(trekData.customFields)) {
        try {
          setFetchingTrekData(true);
          console.log('Fetching trek data for custom fields...');
          const fetchedTrekData = await getTrekByIdForAdmin(trekId);
          console.log('Fetched trek data:', fetchedTrekData);
          setLocalTrekData(fetchedTrekData);
        } catch (error) {
          console.error('Error fetching trek data:', error);
        } finally {
          setFetchingTrekData(false);
        }
      } else {
        setLocalTrekData(trekData);
      }
    };

    if (isOpen) {
      fetchTrekData();
    }
  }, [isOpen, trekId, trekData]);

  // Prevent scrolling of the background when modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Ensure body scrolling is restored when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

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

    { key: 'additionalRequests', label: 'Additional Requests', category: 'Logistics' }
  ];

  // Use useMemo to prevent recreation of allFields on every render
  const allFields = useMemo(() => {
    const fields = [...availableFields];
    console.log('Processing custom fields from trekData:', localTrekData);
    console.log('localTrekData.customFields:', localTrekData?.customFields);
    console.log('localTrekData.customFields type:', typeof localTrekData?.customFields);
    console.log('localTrekData.customFields is array:', Array.isArray(localTrekData?.customFields));
    
    if (localTrekData?.customFields && Array.isArray(localTrekData.customFields)) {
      console.log('Custom fields array length:', localTrekData.customFields.length);
      localTrekData.customFields.forEach((field, index) => {
        console.log(`Adding custom field ${index}:`, field);
        
        // Determine category based on field name or type
        let category = 'Custom Fields';
        const fieldNameLower = field.fieldName.toLowerCase();
        
        // Categorize emergency contact related custom fields
        if (fieldNameLower.includes('emergency') || fieldNameLower.includes('contact')) {
          category = 'Emergency Contact';
        } else if (fieldNameLower.includes('medical') || fieldNameLower.includes('health') || fieldNameLower.includes('allergy')) {
          category = 'Health & Safety';

        } else if (fieldNameLower.includes('booking') || fieldNameLower.includes('user')) {
          category = 'Booking Information';
        }
        
        const newField = {
          key: `custom_${field.fieldName}`,
          label: field.fieldName,
          category: category,
          fieldType: field.fieldType,
          isRequired: field.isRequired
        };
        
        console.log('Adding field to fields array:', newField);
        fields.push(newField);
      });
    } else {
      console.log('No custom fields found or customFields is not an array');
    }
    
    console.log('Total fields available:', fields.length);
    console.log('Final fields array:', fields);
    return fields;
  }, [localTrekData?.customFields]);

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
      if (fileType === 'csv') {
        // For CSV, select all fields by default
        const allFieldKeys = allFields.map(field => field.key);
        setSelectedFields(allFieldKeys);
      } else {
        // For PDF, use priority fields with 10 field limit
        const priorityFields = [
          'participantName',
          'participantAge', 
          'participantGender',
          'emergencyContactName',
          'emergencyContactPhone',
          'emergencyContactRelation',
          'bookingUserName',
          'bookingUserEmail',
          'bookingUserPhone',
          'bookingDate'
        ];
        
        // Get priority fields that exist in allFields
        const selectedPriorityFields = priorityFields.filter(field => 
          allFields.some(f => f.key === field)
        );
        
        // Fill remaining slots with other fields up to 10 total
        const remainingSlots = 10 - selectedPriorityFields.length;
        const otherFields = allFields
          .filter(field => !selectedPriorityFields.includes(field.key))
          .slice(0, remainingSlots)
          .map(field => field.key);
        
        setSelectedFields([...selectedPriorityFields, ...otherFields]);
      }
    }
  }, [isOpen, allFields, selectedFields.length, hasBeenCleared, fileType]);

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
        : fileType === 'csv' 
          ? [...prev, fieldKey] // No limit for CSV
          : prev.length < 10 
            ? [...prev, fieldKey] // 10 field limit for PDF
            : prev;
      
      if (fileType === 'pdf' && prev.length >= 10 && !prev.includes(fieldKey)) {
        toast.error('Maximum 10 fields allowed for PDF export');
      }
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    // Use the same priority logic as default selection
    const priorityFields = [
      'participantName',
      'participantAge', 
      'participantGender',
      'emergencyContactName',
      'emergencyContactPhone',
      'emergencyContactRelation',
      'bookingUserName',
      'bookingUserEmail',
      'bookingUserPhone',
      'bookingDate'
    ];
    
    // Get priority fields that exist in allFields
    const selectedPriorityFields = priorityFields.filter(field => 
      allFields.some(f => f.key === field)
    );
    
    // Fill remaining slots with other fields up to 10 total
    const remainingSlots = 10 - selectedPriorityFields.length;
    const otherFields = allFields
      .filter(field => !selectedPriorityFields.includes(field.key))
      .slice(0, remainingSlots)
      .map(field => field.key);
    
    setSelectedFields([...selectedPriorityFields, ...otherFields]);
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
      const response = await exportBatchParticipants(trekId, batchId, selectedFields, fileType);
      
      // Create download link
      const mimeType = fileType === 'csv' ? 'text/csv' : 'application/pdf';
      const fileExtension = fileType === 'csv' ? 'csv' : 'pdf';
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch-participants-${localTrekData?.name || 'trek'}-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${fileType.toUpperCase()} exported successfully!`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${fileType.toUpperCase()}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity z-40"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Centering Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Modal Panel */}
        <div
          className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate flex-1 mr-2">
              Export Participant Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full p-1 touch-target"
              aria-label="Close modal"
            >
              <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          
          {/* Content - This will scroll if it overflows */}
          <div className="flex-1 px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto">
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                {fileType === 'csv' ? (
                  <>
                    Select fields to include in the CSV export. Currently selected: <span className="font-semibold text-emerald-600">{selectedFields.length}</span> fields
                    <br />
                    <span className="text-xs text-gray-500">No field limit for CSV export. All fields will be included in the Excel file.</span>
                  </>
                ) : (
                  <>
                    Select up to 10 fields to include in the PDF export. Currently selected: <span className="font-semibold text-emerald-600">{selectedFields.length}/10</span>
                    <br />
                    <span className="text-xs text-gray-500">Priority fields (participant details, emergency contact, booking info) are automatically selected by default.</span>
                  </>
                )}
              </p>
              
              {/* File Type Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="pdf"
                      checked={fileType === 'pdf'}
                      onChange={(e) => setFileType(e.target.value)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">PDF Document</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={fileType === 'csv'}
                      onChange={(e) => setFileType(e.target.value)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Excel/CSV File</span>
                  </label>
                </div>
              </div>
              
              {fetchingTrekData && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Loading Custom Fields...</span> Fetching trek data to display available custom fields.
                  </p>
                </div>
              )}
              
              {localTrekData?.customFields && localTrekData.customFields.length > 0 && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Custom Fields Available:</span> This trek has {localTrekData.customFields.length} custom field(s) that can be included in the export.
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Custom fields are automatically categorized based on their names. Emergency contact, medical, and logistics related fields will appear in their respective categories.
                  </p>
                </div>
              )}
              
              {!fetchingTrekData && !localTrekData?.customFields && (
                <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">No Custom Fields:</span> This trek doesn't have any custom fields defined.
                  </p>
                </div>
              )}
              <div className="flex gap-2 mb-4">
                {fileType === 'csv' ? (
                  <>
                    <button
                      onClick={handleSelectAll}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
                    >
                      Select All Fields
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSelectAll}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
                    >
                      Select Priority Fields
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </>
                )}
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
                          {field.isRequired && (
                            <span className="text-xs text-red-500 ml-1">*</span>
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
          <div className="flex-shrink-0 flex justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={loading || selectedFields.length === 0 || (fileType === 'pdf' && selectedFields.length > 10)}
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
                  Export {fileType.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ParticipantExportModal; 