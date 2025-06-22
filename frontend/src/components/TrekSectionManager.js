import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  getTreks,
  createTrekSection,
  updateTrekSection,
  deleteTrekSection,
  getTrekSections,
} from "../services/api";
import { toast } from "react-toastify";
import Modal from "./Modal";
import { FaEdit, FaTrash, FaEye, FaEyeSlash } from "react-icons/fa";

const TrekSectionManager = forwardRef(
  (
    {
      showModal: externalShowModal,
      setShowModal: setExternalShowModal,
      onSectionChange,
    },
    ref
  ) => {
    const [sections, setSections] = useState([]);
    const [allTreks, setAllTreks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [internalShowModal, setInternalShowModal] = useState(false);
    const [currentSection, setCurrentSection] = useState({
      title: "",
      treks: [],
      isActive: true,
      displayOrder: 0,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      handleEdit: (section) => {
        handleEdit(section);
      },
      confirmDelete: (sectionId) => {
        setDeleteConfirmation(sectionId);
      },
    }));

    // Use external modal state if provided
    useEffect(() => {
      if (externalShowModal !== undefined) {
        setInternalShowModal(externalShowModal);
      }
    }, [externalShowModal]);

    // Update external modal state if provided
    useEffect(() => {
      if (setExternalShowModal && internalShowModal !== externalShowModal) {
        setExternalShowModal(internalShowModal);
      }
    }, [internalShowModal, externalShowModal, setExternalShowModal]);

    useEffect(() => {
      fetchData();
    }, []);

    const fetchData = async () => {
      try {
        setLoading(true);
        const [sectionsData, treksData] = await Promise.all([
          getTrekSections(),
          getTreks({ limit: 100 }),
        ]);

        setSections(sectionsData);
        setAllTreks(treksData);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setCurrentSection((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleTrekCheckboxChange = (trekId) => {
      setCurrentSection((prev) => {
        const treks = [...prev.treks];
        if (treks.includes(trekId)) {
          return { ...prev, treks: treks.filter((id) => id !== trekId) };
        } else {
          return { ...prev, treks: [...treks, trekId] };
        }
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        setLoading(true);

        if (isEditing) {
          await updateTrekSection(currentSection._id, currentSection);
          toast.success("Section updated successfully");
        } else {
          await createTrekSection(currentSection);
          toast.success("Section created successfully");
        }

        // Reset form and refresh data
        resetForm();
        fetchData();

        // Notify parent component
        if (onSectionChange) {
          onSectionChange();
        }
      } catch (err) {
        console.error("Error saving section:", err);
        toast.error("Failed to save section");
      } finally {
        setLoading(false);
        setInternalShowModal(false);
      }
    };

    const handleDelete = async (id) => {
      try {
        setLoading(true);
        await deleteTrekSection(id);
        setDeleteConfirmation(null);
        toast.success("Section deleted successfully");
        fetchData();

        // Notify parent component
        if (onSectionChange) {
          onSectionChange();
        }
      } catch (err) {
        console.error("Error deleting section:", err);
        toast.error("Failed to delete section");
      } finally {
        setLoading(false);
      }
    };

    const handleToggleStatus = async (section) => {
      try {
        setLoading(true);
        const updatedSection = { ...section, isActive: !section.isActive };
        await updateTrekSection(section._id, updatedSection);
        toast.success(
          `Section ${
            updatedSection.isActive ? "activated" : "deactivated"
          } successfully`
        );
        fetchData();

        // Notify parent component
        if (onSectionChange) {
          onSectionChange();
        }
      } catch (err) {
        console.error("Error updating section status:", err);
        toast.error("Failed to update section status");
      } finally {
        setLoading(false);
      }
    };

    const handleEdit = (section) => {
      setCurrentSection({
        ...section,
        treks: section.treks.map((trek) => trek._id || trek),
      });
      setIsEditing(true);
      setInternalShowModal(true);
    };

    const resetForm = () => {
      setCurrentSection({
        title: "",
        treks: [],
        isActive: true,
        displayOrder: 0,
      });
      setIsEditing(false);
    };

    const closeModal = () => {
      setInternalShowModal(false);
      resetForm();
      if (setExternalShowModal) {
        setExternalShowModal(false);
      }
    };

    return (
      <div className="py-4 sm:py-6 max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
        {/* Section List */}
        {!externalShowModal && (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Trek Sections
              </h1>
              <button
                onClick={() => {
                  resetForm();
                  setInternalShowModal(true);
                }}
                className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 touch-target"
              >
                Add Section
              </button>
            </div>

          

            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : error ? (
              <div className="text-red-500 py-4">{error}</div>
            ) : sections.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No sections found. Create your first section.
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {sections.map((section) => (
                    <li key={section._id}>
                      <div className="px-3 py-3 sm:px-4 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                            {section.title}
                          </h3>
                          <p className="mt-1 text-xs sm:text-sm text-gray-500">
                            {section.treks.length} treks | Order:{" "}
                            {section.displayOrder}
                          </p>
                        </div>
                        <div className="flex space-x-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleToggleStatus(section)}
                            className={`p-2 rounded-full touch-target ${
                              section.isActive
                                ? "bg-green-100 text-green-600 hover:bg-green-200"
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
                            title={section.isActive ? "Deactivate" : "Activate"}
                          >
                            {section.isActive ? <FaEye className="h-4 w-4" /> : <FaEyeSlash className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(section)}
                            className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 touch-target"
                            title="Edit"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmation(section._id)}
                            className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 touch-target"
                            title="Delete"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Add/Edit Modal */}
        {internalShowModal && (
          <Modal
            isOpen={internalShowModal}
            onClose={closeModal}
            title={isEditing ? "Edit Trek Section" : "Create Trek Section"}
          >
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Section Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={currentSection.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Treks *
                  </label>
                  <div className="max-h-48 sm:max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {allTreks.map((trek) => (
                      <div key={trek._id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`trek-${trek._id}`}
                          checked={currentSection.treks.includes(trek._id)}
                          onChange={() => handleTrekCheckboxChange(trek._id)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`trek-${trek._id}`}
                          className="ml-2 block text-sm text-gray-900 cursor-pointer"
                        >
                          <span className="font-medium">{trek.name}</span>
                          <span className="text-gray-500 ml-1">- {trek.region}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="displayOrder"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Display Order
                  </label>
                  <input
                    type="number"
                    id="displayOrder"
                    name="displayOrder"
                    value={currentSection.displayOrder}
                    onChange={handleInputChange}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={currentSection.isActive}
                    onChange={(e) =>
                      setCurrentSection((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 block text-sm text-gray-900 cursor-pointer"
                  >
                    Active
                  </label>
                </div>
              </div>

              <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-3 sm:py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:col-start-2 sm:text-sm touch-target"
                >
                  {loading ? "Saving..." : isEditing ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-3 sm:py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:col-start-1 sm:text-sm touch-target"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation && (
          <Modal
            isOpen={!!deleteConfirmation}
            onClose={() => setDeleteConfirmation(null)}
            title="Confirm Deletion"
          >
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this section? This action cannot
                be undone.
              </p>
            </div>
            <div className="mt-5 sm:mt-4 flex flex-col-reverse sm:flex-row sm:flex-row-reverse gap-3">
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmation)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-3 sm:py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm touch-target"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-3 sm:py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm touch-target"
              >
                Cancel
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
  }
);

export default TrekSectionManager;
