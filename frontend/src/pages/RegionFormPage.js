import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRegionById, createRegion, updateRegion } from '../services/api';
import { toast } from 'react-toastify';
import RegionForm from '../components/RegionForm';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminLayout from '../layouts/AdminLayout';

function RegionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(!!id);
  const [region, setRegion] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (id) {
      const fetchRegion = async () => {
        try {
          setLoading(true);
          const data = await getRegionById(id);
          setRegion(data);
          setError(null);
        } catch (err) {
          console.error('Error fetching region:', err);
          setError('Failed to load region');
          toast.error('Failed to load region');
        } finally {
          setLoading(false);
        }
      };

      fetchRegion();
    }
  }, [id]);

  const handleSave = async (formData) => {
    try {
      setLoading(true);
      if (id) {
        await updateRegion(id, formData);
        toast.success('Region updated successfully');
      } else {
        await createRegion(formData);
        toast.success('Region created successfully');
      }
      navigate('/admin/regions');
    } catch (err) {
      console.error('Error saving region:', err);
      toast.error(err.response?.data?.message || 'Failed to save region');
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
     
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>

    );
  }

  return (
<>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {id ? 'Edit Region' : 'Create New Region'}
          </h1>
        </div>
        <RegionForm 
          region={region} 
          onSave={handleSave} 
          isEditing={!!id} 
        />
      </div>
      </>
  );
}

export default RegionFormPage; 