import React, { useState } from "react";

const ExportModal = ({ isOpen, onClose, onExport }) => {
  const [selectedFields, setSelectedFields] = useState({
    name: true,
    email: true,
    phone: true,
    status: true,
    source: true,
    createdAt: true,
    assignedTo: true,
    notes: false,
    requestCallback: false,
    trekId: false,
  });

  const [fileType, setFileType] = useState("excel");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const fields = [
    { id: "name", label: "Name" },
    { id: "email", label: "Email" },
    { id: "phone", label: "Phone" },
    { id: "status", label: "Status" },
    { id: "source", label: "Source" },
    { id: "createdAt", label: "Created Date" },
    { id: "assignedTo", label: "Assigned To" },
    { id: "notes", label: "Notes" },
    { id: "requestCallback", label: "Callback Request" },
    { id: "trekId", label: "Trek Details" },
  ];

  const handleFieldToggle = (fieldId) => {
    setSelectedFields((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedFields).every((value) => value);
    const newValue = !allSelected;
    const newSelectedFields = {};
    fields.forEach((field) => {
      newSelectedFields[field.id] = newValue;
    });
    setSelectedFields(newSelectedFields);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleExport = () => {
    const fieldsToExport = Object.entries(selectedFields)
      .filter(([_, selected]) => selected)
      .map(([field]) => field);

    onExport({
      fields: fieldsToExport,
      fileType,
      dateRange: {
        startDate: dateRange.startDate || null,
        endDate: dateRange.endDate || null,
      },
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Export Leads</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Date Range Section */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Date Range (Optional)</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Select Fields Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Select Fields</h4>
              <button
                onClick={handleSelectAll}
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                {Object.values(selectedFields).every((value) => value)
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {fields.map((field) => (
                <label
                  key={field.id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields[field.id]}
                    onChange={() => handleFieldToggle(field.id)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* File Type Selection */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">File Type</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="excel"
                  checked={fileType === "excel"}
                  onChange={(e) => setFileType(e.target.value)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Excel (.xlsx)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="pdf"
                  checked={fileType === "pdf"}
                  onChange={(e) => setFileType(e.target.value)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">PDF (.pdf)</span>
              </label>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={!Object.values(selectedFields).some((value) => value)}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal; 