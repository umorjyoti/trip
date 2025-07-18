import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  getAdmins,
  updateUserRole,
  getAllUserGroups,
  updateUserGroupAssignment,
} from "../services/api";

function AdminTeam() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter admins based on search term
    if (searchTerm.trim() === "") {
      setFilteredAdmins(admins);
    } else {
      const filtered = admins.filter(
        (admin) =>
          admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAdmins(filtered);
    }
  }, [searchTerm, admins]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adminsData, groupsData] = await Promise.all([
        getAdmins(),
        getAllUserGroups(),
      ]);
      setAdmins(adminsData);
      setFilteredAdmins(adminsData);
      setUserGroups(groupsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success("User role updated successfully");
      fetchData();
    } catch (err) {
      console.error("Error updating user role:", err);
      toast.error(err.response?.data?.message || "Failed to update user role");
    }
  };

  const handleGroupChange = async (userId, groupId) => {
    try {
      await updateUserGroupAssignment(userId, groupId);
      toast.success("User group updated successfully");
      fetchData();
    } catch (err) {
      console.error("Error updating user group:", err);
      toast.error(err.response?.data?.message || "Failed to update user group");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Team</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate("/admin/users")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              View All Users
            </button>
            <button
              onClick={() => navigate("/admin/user-groups")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Manage User Groups
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="max-w-md">
            <label htmlFor="search" className="sr-only">
              Search admin users
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Search admin users by name or email..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {searchTerm && (
            <p className="mt-2 text-sm text-gray-600">
              Showing {filteredAdmins.length} of {admins.length} admin users
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Admin Users ({filteredAdmins.length})
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage admin users and their permissions
            </p>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Group
                </th>
                
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? "No admin users found matching your search" : "No admin users found"}
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {admin.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={admin.role}
                        onChange={(e) =>
                          handleRoleChange(admin._id, e.target.value)
                        }
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={admin.group?._id || ""}
                        onChange={(e) =>
                          handleGroupChange(admin._id, e.target.value)
                        }
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                      >
                        <option value="">No Group</option>
                        {userGroups.map((group) => (
                          <option key={group._id} value={group._id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default AdminTeam; 