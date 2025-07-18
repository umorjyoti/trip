import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRegions, deleteRegion } from "../services/api";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";
import AdminLayout from "../layouts/AdminLayout";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { formatLocation } from "../utils/formatters";

function RegionManager() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const data = await getRegions();
      setRegions(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching regions:", err);
      setError("Failed to load regions");
      toast.error("Failed to load regions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = (id) => {
    setDeleteConfirmation(id);
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      setLoading(true);
      await deleteRegion(deleteConfirmation);
      toast.success("Region deleted successfully");
      setDeleteConfirmation(null);
      fetchRegions();
    } catch (err) {
      console.error("Error deleting region:", err);
      toast.error("Failed to delete region");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Manage Regions
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md ${
                    viewMode === "list"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md ${
                    viewMode === "grid"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
              </div>
              <Link
                to="/admin/regions/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                Add Region
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {regions.length === 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
              <p className="text-gray-500 mb-4">No regions found.</p>
              <Link
                to="/admin/regions/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                Create Your First Region
              </Link>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {regions.map((region) => (
                <div
                  key={region._id}
                  className="bg-white shadow rounded-lg overflow-hidden"
                >
                  <div className="relative h-48">
                    {region.coverImage ? (
                      <img
                        className="w-full h-full object-cover"
                        src={region.coverImage}
                        alt={region.name}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-2xl">
                          {region.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <Link
                        to={`/regions/${formatLocation(region.name)}`}
                        state={{ id: region?._id }}
                        className="p-2 bg-white rounded-full shadow-md text-emerald-600 hover:bg-emerald-50"
                      >
                        <FaEye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/admin/regions/${region._id}/edit`}
                        className="p-2 bg-white rounded-full shadow-md text-blue-600 hover:bg-blue-50"
                      >
                        <FaEdit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteConfirm(region._id)}
                        className="p-2 bg-white rounded-full shadow-md text-red-600 hover:bg-red-50"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {region.name}
                    </h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaMapMarkerAlt className="mr-2" />
                        {region.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendarAlt className="mr-2" />
                        {region.bestSeason || "Year-round"}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FaClock className="mr-2" />
                        {region.avgTrekDuration
                          ? `${region.avgTrekDuration} days`
                          : "N/A"}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          region.isEnabled
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {region.isEnabled ? "Active" : "Inactive"}
                      </span>
                      <Link
                         to={`/regions/${formatLocation(region.name)}`}
                         state={{ id: region?._id }}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {regions.map((region) => (
                  <li key={region._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          {region.coverImage ? (
                            <img
                              className="h-16 w-16 rounded-lg object-cover"
                              src={region.coverImage}
                              alt={region.name}
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-xl">
                                {region.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-lg font-medium text-gray-900">
                            {region.name}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <FaMapMarkerAlt className="mr-2" />
                            {region.location}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <FaCalendarAlt className="mr-2" />
                            {region.bestSeason || "Year-round"}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <FaClock className="mr-2" />
                            {region.avgTrekDuration
                              ? `${region.avgTrekDuration} days`
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Link
                          to={`/regions/${formatLocation(region.name)}`}
                          state={{ id: region?._id }}
                          className="text-emerald-600 hover:text-emerald-900"
                          title="View"
                        >
                          <FaEye className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/admin/regions/${region._id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <FaEdit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteConfirm(region._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FaTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <Modal
          title="Confirm Deletion"
          onClose={() => setDeleteConfirmation(null)}
        >
          <div className="p-6">
            <p className="mb-4">
              Are you sure you want to delete this region? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default RegionManager;
