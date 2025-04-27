import React, { useState, useEffect, useRef } from "react";
import { getTrekSections } from "../services/api";
import TrekSectionManager from "../components/TrekSectionManager";
import AdminLayout from "../layouts/AdminLayout";
import { FaPlus } from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";

function TrekSectionsPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const trekSectionManagerRef = useRef(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await getTrekSections();
      setSections(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching trek sections:", err);
      setError("Failed to load trek sections");
      toast.error("Failed to load trek sections");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section) => {
    if (trekSectionManagerRef.current) {
      trekSectionManagerRef.current.handleEdit(section);
    }
  };

  const handleDelete = (sectionId) => {
    if (trekSectionManagerRef.current) {
      trekSectionManagerRef.current.confirmDelete(sectionId);
    }
  };

  return (
    <TrekSectionManager
      showModal={showAddModal}
      setShowModal={setShowAddModal}
      onSectionChange={fetchSections}
      ref={trekSectionManagerRef}
    />
  );
}

export default TrekSectionsPage;
