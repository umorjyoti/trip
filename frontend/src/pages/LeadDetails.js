import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getLeadById, updateLead } from "../services/api";
import { toast } from "react-toastify";
import {
  FaUser,
  FaCalendarAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaEdit,
  FaPlus,
  FaExchangeAlt,
  FaStickyNote,
  FaCheck,
} from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";

function LeadDetails() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedLead, setEditedLead] = useState(null);

  useEffect(() => {
    const fetchLeadDetails = async () => {
      try {
        const response = await getLeadById(id);
        setLead(response.lead);
        setHistory(response.history);
        setEditedLead(response.lead);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching lead:", err);
        setError("Failed to load lead details. Please try again.");
        setLoading(false);
      }
    };

    fetchLeadDetails();
  }, [id]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedLead((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: editedLead.name,
        email: editedLead.email,
        phone: editedLead.phone,
        status: editedLead.status,
        notes: editedLead.notes,
        assignedTo: editedLead.assignedTo,
        requestCallback: editedLead.requestCallback
      };
      
      await updateLead(id, updateData);
      setLead(editedLead);
      setEditing(false);
      toast.success("Lead updated successfully");
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatUserDisplay = (user) => {
    if (!user) return 'Unassigned';
    return user.name ? user.name : user.email;
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return <FaPlus className="text-green-500" />;
      case 'status_changed':
        return <FaExchangeAlt className="text-blue-500" />;
      case 'assigned':
        return <FaUser className="text-purple-500" />;
      case 'note_added':
        return <FaStickyNote className="text-yellow-500" />;
      case 'callback_requested':
        return <FaPhone className="text-red-500" />;
      case 'callback_completed':
        return <FaCheck className="text-green-500" />;
      default:
        return <FaEdit className="text-gray-500" />;
    }
  };

  const getActionText = (action, field, oldValue, newValue) => {
    switch (action) {
      case 'created':
        return 'Lead was created';
      case 'status_changed':
        return `Status changed from ${oldValue} to ${newValue}`;
      case 'assigned':
        return `Assigned from ${formatUserDisplay(oldValue)} to ${formatUserDisplay(newValue)}`;
      case 'note_added':
        return 'Note was added';
      case 'callback_requested':
        return 'Callback was requested';
      case 'callback_completed':
        return 'Callback was completed';
      default:
        return `${field} was updated`;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!lead) {
    return <div className="text-gray-500">Lead not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Lead Details</h1>
        <Link
          to="/admin/leads"
          className="text-sm text-emerald-600 hover:text-emerald-900"
        >
          ← Back to Leads
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Lead Information
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.name || 'Not provided'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.email || 'Not provided'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.phone || 'Not provided'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.status || 'Not set'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Source</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.source || 'Not provided'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'Not available'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.notes || 'No notes available'}</dd>
            </div>
          </dl>
        </div>

        {editing && (
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Save Changes
            </button>
          </div>
        )}

        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Activity History
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {history.map((entry) => (
                <li key={entry._id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {getActionIcon(entry.action)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {formatUserDisplay(entry.performedBy)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getActionText(entry.action, entry.field, entry.oldValue, entry.newValue)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(entry.performedAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeadDetails;
