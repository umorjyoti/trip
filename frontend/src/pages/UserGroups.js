import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import AdminLayout from "../layouts/AdminLayout";
import Modal from "../components/Modal";
import {
  getAllUserGroups,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  getUserGroup,
} from "../services/api";

function UserGroups() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isNewGroup = location.pathname === "/admin/user-groups/new";
  const isEditGroup = id && location.pathname.includes("/edit");
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: {
      stats: {
        treks: false,
        bookings: false,
        region: false,
        sales: false,
        users: false,
        ongoingTreks: false
      },
      actions: {
        manageTreks: false,
        manageWeekendGetaways: false,
        manageRegions: false,
        manageBookings: false,
        manageUsers: false,
        manageTeam: false,
        supportTickets: false,
        salesDashboard: false,
        manageLeads: false,
        trekSections: false,
        manageUserGroups: false,
        manageBlogs: false,
        manageCareers: false
      }
    }
  });

  useEffect(() => {
    if (isEditGroup) {
      fetchGroupData();
    } else if (!isNewGroup) {
      fetchUserGroups();
    } else {
      setLoading(false);
    }
  }, [isNewGroup, isEditGroup, id]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserGroup(id);
      if (!data) {
        throw new Error('Group not found');
      }
      setFormData({
        name: data.name || '',
        description: data.description || '',
        permissions: {
          stats: {
            treks: data.permissions?.stats?.treks || false,
            bookings: data.permissions?.stats?.bookings || false,
            region: data.permissions?.stats?.region || false,
            sales: data.permissions?.stats?.sales || false,
            users: data.permissions?.stats?.users || false,
            ongoingTreks: data.permissions?.stats?.ongoingTreks || false
          },
          actions: {
            manageTreks: data.permissions?.actions?.manageTreks || false,
            manageWeekendGetaways: data.permissions?.actions?.manageWeekendGetaways || false,
            manageRegions: data.permissions?.actions?.manageRegions || false,
            manageBookings: data.permissions?.actions?.manageBookings || false,
            manageUsers: data.permissions?.actions?.manageUsers || false,
            manageTeam: data.permissions?.actions?.manageTeam || false,
            supportTickets: data.permissions?.actions?.supportTickets || false,
            salesDashboard: data.permissions?.actions?.salesDashboard || false,
            manageLeads: data.permissions?.actions?.manageLeads || false,
            trekSections: data.permissions?.actions?.trekSections || false,
            manageUserGroups: data.permissions?.actions?.manageUserGroups || false,
            manageBlogs: data.permissions?.actions?.manageBlogs || false,
            manageCareers: data.permissions?.actions?.manageCareers || false
          }
        }
      });
    } catch (err) {
      console.error("Error fetching group:", err);
      setError(err.response?.data?.message || "Failed to load group data");
      toast.error(err.response?.data?.message || "Failed to load group data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUserGroups();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      setUserGroups(data);
    } catch (err) {
      console.error("Error fetching user groups:", err);
      setError(err.response?.data?.message || "Failed to load user groups");
      toast.error(err.response?.data?.message || "Failed to load user groups");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePermissionChange = (section, permission, value) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [section]: {
          ...prev.permissions[section],
          [permission]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (isEditGroup) {
        await updateUserGroup(id, formData);
        toast.success("User group updated successfully");
        navigate("/admin/user-groups");
      } else {
        await createUserGroup(formData);
        toast.success("User group created successfully");
        navigate("/admin/user-groups");
      }
    } catch (err) {
      console.error("Error saving user group:", err);
      setError(err.response?.data?.message || "Failed to save user group");
      toast.error(err.response?.data?.message || "Failed to save user group");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await deleteUserGroup(groupToDelete._id);
      toast.success("User group deleted successfully");
      setShowDeleteModal(false);
      setGroupToDelete(null);
      await fetchUserGroups();
    } catch (err) {
      console.error("Error deleting user group:", err);
      setError(err.response?.data?.message || "Failed to delete user group");
      toast.error(err.response?.data?.message || "Failed to delete user group");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (group) => {
    setGroupToDelete(group);
    setShowDeleteModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">
            {isNewGroup
              ? "Create New User Group"
              : isEditGroup
              ? "Edit User Group"
              : "User Groups"}
          </h1>
          {!isNewGroup && !isEditGroup && (
            <Link
              to="/admin/user-groups/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Add User Group
            </Link>
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

        {!isNewGroup && !isEditGroup ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userGroups.map((group) => (
                  <tr key={group._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {group.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/admin/user-groups/${group._id}/edit`}
                        className="text-emerald-600 hover:text-emerald-900 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => confirmDelete(group)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Group Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Permissions
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">
                          Stats
                        </h4>
                        <div className="mt-2 space-y-2">
                          {Object.entries(formData.permissions.stats).map(
                            ([key, value]) => (
                              <div key={key} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`stats.${key}`}
                                  name={`stats.${key}`}
                                  checked={value}
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      "stats",
                                      key,
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor={`stats.${key}`}
                                  className="ml-2 block text-sm text-gray-900"
                                >
                                  {key.charAt(0).toUpperCase() + key.slice(1)}
                                </label>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700">
                          Actions
                        </h4>
                        <div className="mt-2 space-y-2">
                          {Object.entries(formData.permissions.actions).map(
                            ([key, value]) => (
                              <div key={key} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`actions.${key}`}
                                  name={`actions.${key}`}
                                  checked={value}
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      "actions",
                                      key,
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor={`actions.${key}`}
                                  className="ml-2 block text-sm text-gray-900"
                                >
                                  {key
                                    .split(/(?=[A-Z])/)
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1)
                                    )
                                    .join(" ")}
                                </label>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Link
                    to="/admin/user-groups"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    {isEditGroup ? "Update Group" : "Create Group"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setGroupToDelete(null);
          }}
          title="Delete User Group"
        >
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete the group "{groupToDelete?.name}"?
              This action cannot be undone.
            </p>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
              onClick={handleDelete}
            >
              Delete
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={() => {
                setShowDeleteModal(false);
                setGroupToDelete(null);
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      </div>
    </>
  );
}

export default UserGroups;
