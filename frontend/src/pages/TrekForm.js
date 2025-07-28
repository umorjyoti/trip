import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createTrek, getTrekByIdForAdmin, updateTrek, getRegions } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';
import ImageUploader from '../components/ImageUploader';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import api from '../services/api';

// Helper: FormSection component
const FormSection = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow space-y-6">
    <h2 className="text-lg font-medium text-gray-900">{title}</h2>
    {children}
  </div>
);

// Helper: Input component for consistency
const InputField = ({ label, id, type = 'text', value, onChange, required = false, placeholder = '', disabled = false, error = null, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      disabled={disabled}
      className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'} sm:text-sm transition-colors ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

// Helper: Textarea component
const TextareaField = ({ label, id, value, onChange, required = false, placeholder = '', rows = 3, error = null, ...props }) => (
   <div>
     <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
       {label} {required && <span className="text-red-500">*</span>}
     </label>
     <textarea
       id={id}
       name={id}
       rows={rows}
       value={value}
       onChange={onChange}
       required={required}
       placeholder={placeholder}
       className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'} sm:text-sm transition-colors`}
       {...props}
     />
     {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
   </div>
 );

// Helper: Select component
const SelectField = ({ label, id, value, onChange, required = false, children, error = null, ...props }) => (
   <div>
     <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
       {label} {required && <span className="text-red-500">*</span>}
     </label>
     <select
       id={id}
       name={id}
       value={value}
       onChange={onChange}
       required={required}
       className={`block w-full pl-3 pr-10 py-2 text-base border ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-emerald-500 focus:border-emerald-500'} sm:text-sm rounded-md transition-colors`}
       {...props}
     >
       {children}
     </select>
     {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
   </div>
 );

// Helper: Button component
const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, icon: Icon, className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "border-transparent text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
    secondary: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-emerald-500",
    danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
    ghost: "border-transparent text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:ring-emerald-500",
    icon: "p-1 border-transparent rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:ring-emerald-500"
  };
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      {...props}
    >
      {Icon && <Icon className={`-ml-0.5 mr-2 h-4 w-4 ${variant === 'icon' ? 'm-0 h-5 w-5' : ''}`} aria-hidden="true" />}
      {children}
    </motion.button>
  );
};

// Define categories
const categories = [
  'all-treks', 'monsoon-treks', 'sunrise-treks', 'himalayan-treks', 'backpacking-trips', 'long-weekend'
];
const categoryNames = {
  'all-treks': 'All Treks', 
  'monsoon-treks': 'Monsoon Treks', 
  'sunrise-treks': 'Sunrise Treks',
  'himalayan-treks': 'Himalayan Treks', 
  'backpacking-trips': 'Backpacking Trips', 
  'long-weekend': 'Long Weekend'
};

function TrekForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [regions, setRegions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region: '',
    difficulty: 'Easy',
    duration: 1,
    season: ['Spring'],
    startingPoint: '',
    endingPoint: '',
    displayPrice: '',
    strikedPrice: '',
    imageUrl: '',
    images: [],
    isEnabled: true,
    category: 'all-treks',
    maxAltitude: '',
    distance: '',
    highlights: [''],
    addOns: [],
    customFields: [
      {
        fieldName: '',
        fieldType: 'text',
        isRequired: false,
        options: [],
        description: '',
        placeholder: ''
      }
    ],
    gstPercent: '',
    gstType: 'excluded',
    gatewayPercent: '',
    gatewayType: 'customer',
    itineraryPdfUrl: '',
    isCustom: false,
    partialPayment: {
      enabled: false,
      amount: 0,
      amountType: 'fixed',
      finalPaymentDueDays: 3,
      autoCancelOnDueDate: true
    }
  });
  const [batches, setBatches] = useState([{ startDate: '', endDate: '', price: '', maxParticipants: 10, currentParticipants: 0 }]);
  const [itinerary, setItinerary] = useState([{ title: 'Day 1', description: '', accommodation: '', meals: '', activities: [''] }]);
  const [includes, setIncludes] = useState(['']);
  const [excludes, setExcludes] = useState(['']);
  const [thingsToPack, setThingsToPack] = useState([{ title: '', description: '', icon: '' }]);
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }]);
  const [formErrors, setFormErrors] = useState({});
  const [pdfUploading, setPdfUploading] = useState(false);
  const [customAccessUrl, setCustomAccessUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        const regionsData = await getRegions();
        setRegions(regionsData || []);

        if (id) {
          const trekData = await getTrekByIdForAdmin(id);
          setFormData({
            name: trekData.name || '',
            description: trekData.description || '',
            region: trekData.region?._id || trekData.region || '',
            difficulty: trekData.difficulty || 'Easy',
            duration: trekData.duration || 1,
            season: Array.isArray(trekData.season) ? trekData.season : [trekData.season || 'Spring'],
            startingPoint: trekData.startingPoint || '',
            endingPoint: trekData.endingPoint || '',
            displayPrice: trekData.displayPrice || '',
            strikedPrice: trekData.strikedPrice || '',
            imageUrl: trekData.imageUrl || '',
            images: trekData.images || [],
            isEnabled: trekData.isEnabled !== undefined ? trekData.isEnabled : true,
            category: trekData.category || 'all-treks',
            maxAltitude: trekData.maxAltitude || '',
            distance: trekData.distance || '',
            highlights: trekData.highlights || [''],
            addOns: trekData.addOns?.length > 0 ? trekData.addOns : [],
            customFields: trekData.customFields?.length > 0 ? trekData.customFields : [
              {
                fieldName: '',
                fieldType: 'text',
                isRequired: false,
                options: [],
                description: '',
                placeholder: ''
              }
            ],
            gstPercent: trekData.gstPercent || '',
            gstType: trekData.gstType || 'excluded',
            gatewayPercent: trekData.gatewayPercent || '',
            gatewayType: trekData.gatewayType || 'customer',
            itineraryPdfUrl: trekData.itineraryPdfUrl || '',
            isCustom: trekData.isCustom !== undefined ? trekData.isCustom : false,
            partialPayment: trekData.partialPayment || {
              enabled: false,
              amount: 0,
              amountType: 'fixed',
              finalPaymentDueDays: 3,
              autoCancelOnDueDate: true
            }
          });

          setBatches(trekData.batches?.length > 0 ? trekData.batches.map(b => ({ ...b, startDate: b.startDate?.split('T')[0] || '', endDate: b.endDate?.split('T')[0] || '' })) : [{ startDate: '', endDate: '', price: '', maxParticipants: 10, currentParticipants: 0 }]);
          setItinerary(trekData.itinerary?.length > 0 ? trekData.itinerary.map(day => ({ ...day, activities: day.activities?.length > 0 ? day.activities : [''] })) : [{ title: 'Day 1', description: '', accommodation: '', meals: '', activities: [''] }]);
          setIncludes(trekData.includes?.length > 0 ? trekData.includes : ['']);
          setExcludes(trekData.excludes?.length > 0 ? trekData.excludes : ['']);
          setThingsToPack(trekData.thingsToPack?.length > 0 ? trekData.thingsToPack : [{ title: '', description: '', icon: '' }]);
          setFaqs(trekData.faqs?.length > 0 ? trekData.faqs : [{ question: '', answer: '' }]);
        } else {
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(`Failed to load ${id ? 'trek data' : 'regions'}. Please try again.`);
        if (id) navigate('/admin/treks');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handlePartialPaymentChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      partialPayment: {
        ...prev.partialPayment,
        [field]: value
      }
    }));
  };

  const handleBatchChange = (index, field, value) => {
    const updatedBatches = [...batches];
    updatedBatches[index][field] = value;
    setBatches(updatedBatches);
  };
  const addBatchField = () => setBatches([...batches, { startDate: '', endDate: '', price: '', maxParticipants: 10, currentParticipants: 0 }]);
  const removeBatchField = (index) => setBatches(batches.filter((_, i) => i !== index));

  const handleItineraryChange = (index, field, value) => {
    const updatedItinerary = [...itinerary];
    updatedItinerary[index][field] = (field === 'meals') ? String(value) : value;
    if (field === 'title' && !value.trim()) {
       updatedItinerary[index]['title'] = `Day ${index + 1}`;
    }
    setItinerary(updatedItinerary);
  };
  const handleItineraryActivityChange = (dayIndex, activityIndex, value) => {
     const updatedItinerary = [...itinerary];
     updatedItinerary[dayIndex].activities[activityIndex] = value;
     setItinerary(updatedItinerary);
  };
  const addItineraryDay = () => setItinerary([...itinerary, { title: `Day ${itinerary.length + 1}`, description: '', accommodation: '', meals: '', activities: [''] }]);
  const removeItineraryDay = (index) => setItinerary(itinerary.filter((_, i) => i !== index));
  const addItineraryActivity = (dayIndex) => {
     const updatedItinerary = [...itinerary];
     updatedItinerary[dayIndex].activities.push('');
     setItinerary(updatedItinerary);
  };
  const removeItineraryActivity = (dayIndex, activityIndex) => {
     const updatedItinerary = [...itinerary];
     updatedItinerary[dayIndex].activities = updatedItinerary[dayIndex].activities.filter((_, i) => i !== activityIndex);
     setItinerary(updatedItinerary);
  };

  const handleListChange = (setter, index, value) => setter(prev => prev.map((item, i) => i === index ? value : item));
  const addListField = (setter, defaultValue) => setter(prev => [...prev, defaultValue]);
  const removeListField = (setter, index) => setter(prev => prev.filter((_, i) => i !== index));

  const handleThingsToPackChange = (index, field, value) => {
     setThingsToPack(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
   const addThingsToPackField = () => setThingsToPack(prev => [...prev, { title: '', description: '', icon: '' }]);
   const removeThingsToPackField = (index) => setThingsToPack(prev => prev.filter((_, i) => i !== index));

  const handleFaqChange = (index, field, value) => {
     setFaqs(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
   const addFaqField = () => setFaqs(prev => [...prev, { question: '', answer: '' }]);
   const removeFaqField = (index) => setFaqs(prev => prev.filter((_, i) => i !== index));

  const handleCustomFieldChange = (index, field, value) => {
    const updatedCustomFields = [...formData.customFields];
    updatedCustomFields[index] = {
      ...updatedCustomFields[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      customFields: updatedCustomFields
    }));
  };

  const addCustomField = () => {
    setFormData(prev => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        {
          fieldName: '',
          fieldType: 'text',
          isRequired: false,
          options: [],
          description: '',
          placeholder: ''
        }
      ]
    }));
  };

  const removeCustomField = (index) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }));
  };

  const handleCustomFieldOptionChange = (fieldIndex, optionIndex, value) => {
    const updatedCustomFields = [...formData.customFields];
    updatedCustomFields[fieldIndex].options[optionIndex] = value;
    setFormData(prev => ({
      ...prev,
      customFields: updatedCustomFields
    }));
  };

  const addCustomFieldOption = (fieldIndex) => {
    const updatedCustomFields = [...formData.customFields];
    updatedCustomFields[fieldIndex].options.push('');
    setFormData(prev => ({
      ...prev,
      customFields: updatedCustomFields
    }));
  };

  const removeCustomFieldOption = (fieldIndex, optionIndex) => {
    const updatedCustomFields = [...formData.customFields];
    updatedCustomFields[fieldIndex].options = updatedCustomFields[fieldIndex].options.filter((_, i) => i !== optionIndex);
    setFormData(prev => ({
      ...prev,
      customFields: updatedCustomFields
    }));
  };

  const handleAddOnChange = (index, field, value) => {
    const updatedAddOns = [...formData.addOns];
    updatedAddOns[index] = {
      ...updatedAddOns[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      addOns: updatedAddOns
    }));
  };

  const addAddOn = () => {
    setFormData(prev => ({
      ...prev,
      addOns: [
        ...prev.addOns,
        {
          name: '',
          description: '',
          price: 0,
          isEnabled: true
        }
      ]
    }));
  };

  const removeAddOn = (index) => {
    setFormData(prev => ({
      ...prev,
      addOns: prev.addOns.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    // Basic Information validation
    if (!formData.name?.trim()) errors.name = 'Trek name is required';
    if (!formData.description?.trim()) errors.description = 'Description is required';
    if (!formData.region) errors.region = 'Region is required';
    if (!formData.season || formData.season.length === 0) errors.season = 'At least one season is required';
    if (!formData.duration || formData.duration <= 0) errors.duration = 'Duration must be greater than 0';
    if (!formData.displayPrice || formData.displayPrice < 0) errors.displayPrice = 'Display price must be non-negative';
    if (formData.strikedPrice && (formData.strikedPrice < 0 || formData.strikedPrice < formData.displayPrice)) {
      errors.strikedPrice = 'Striked price must be non-negative and not less than display price';
    }
    
    // GST validation
    if (formData.gstPercent === '') {
      errors.gstPercent = 'GST percentage is required';
    } else {
      const gstPercent = Number(formData.gstPercent);
      if (isNaN(gstPercent) || gstPercent < 0 || gstPercent > 100) {
        errors.gstPercent = 'GST percentage must be between 0 and 100';
      }
    }
    if (!formData.gstType) errors.gstType = 'GST type is required';

    // Gateway charges validation
    if (formData.gatewayPercent === '') {
      errors.gatewayPercent = 'Gateway percentage is required';
    } else {
      const gatewayPercent = Number(formData.gatewayPercent);
      if (isNaN(gatewayPercent) || gatewayPercent < 0 || gatewayPercent > 100) {
        errors.gatewayPercent = 'Gateway percentage must be between 0 and 100';
      }
    }
    if (!formData.gatewayType) errors.gatewayType = 'Gateway charge type is required';
    
    // Validate highlights - ensure at least one non-empty highlight
    const validHighlights = formData.highlights.filter(h => h?.trim());
    if (!validHighlights.length) {
      errors.highlights = 'At least one highlight is required';
    }

    // Validate images
    if (!formData.images || formData.images.length === 0) {
      errors.imageUrl = 'At least one image is required';
    }
    
    // Batch Information validation
    if (!batches || batches.length === 0) {
      errors.batches = 'At least one batch is required';
    } else {
      batches.forEach((batch, index) => {
        if (!batch.startDate) errors[`batches.${index}.startDate`] = 'Start date is required';
        if (!batch.endDate) errors[`batches.${index}.endDate`] = 'End date is required';
        if (!batch.price || batch.price < 0) errors[`batches.${index}.price`] = 'Price must be non-negative';
        if (!batch.maxParticipants || batch.maxParticipants <= 0) {
          errors[`batches.${index}.maxParticipants`] = 'Max participants must be greater than 0';
        }
      });
    }

    // Itinerary validation
    if (!itinerary || itinerary.length === 0) {
      errors.itinerary = 'At least one day in itinerary is required';
    } else {
      itinerary.forEach((day, index) => {
        if (!day.title?.trim()) errors[`itinerary.${index}.title`] = 'Day title is required';
        if (!day.description?.trim()) errors[`itinerary.${index}.description`] = 'Day description is required';
      });
    }

    // Includes/Excludes validation
    if (!includes || includes.length === 0 || includes.some(inc => !inc?.trim())) {
      errors.includes = 'At least one inclusion is required';
    }
    if (!excludes || excludes.length === 0 || excludes.some(exc => !exc?.trim())) {
      errors.excludes = 'At least one exclusion is required';
    }

    console.log('Form validation errors:', errors);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pdfUploading) {
      toast.error('Please wait for the PDF to finish uploading.');
      return;
    }
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setLoading(true);
    try {
      // Filter out empty highlights
      const validHighlights = formData.highlights.filter(h => h?.trim());

      const trekPayload = {
        ...formData,
        displayPrice: Number(formData.displayPrice),
        strikedPrice: formData.strikedPrice ? Number(formData.strikedPrice) : undefined,
        gstPercent: Number(formData.gstPercent) || 0,
        gstType: formData.gstType || 'excluded',
        gatewayPercent: Number(formData.gatewayPercent) || 0,
        gatewayType: formData.gatewayType || 'customer',
        highlights: validHighlights,
        itineraryPdfUrl: formData.itineraryPdfUrl || '',
        batches: batches.map(b => ({
          ...b,
          _id: b._id, // Preserve the batch ID if it exists
          price: Number(b.price),
          maxParticipants: Number(b.maxParticipants),
          currentParticipants: Number(b.currentParticipants || 0)
        })),
        itinerary: itinerary.map(day => ({
          ...day,
          activities: day.activities.filter(act => act?.trim() !== '')
        })),
        includes: includes.filter(inc => inc?.trim() !== ''),
        excludes: excludes.filter(exc => exc?.trim() !== ''),
        thingsToPack: thingsToPack.filter(item => item.title?.trim() !== '' || item.description?.trim() !== ''),
        faqs: faqs.filter(faq => faq.question?.trim() !== '' || faq.answer?.trim() !== ''),
        customFields: formData.customFields.filter(field => field.fieldName?.trim() !== ''),
        addOns: formData.addOns.filter(addOn => addOn.name?.trim() !== '')
      };

      console.log('Submitting trek payload:', trekPayload);

      let savedTrek;
      if (id) {
        savedTrek = await updateTrek(id, trekPayload);
        toast.success('Trek updated successfully!');
      } else {
        savedTrek = await createTrek(trekPayload);
        toast.success('Trek created successfully!');
        
        // If it's a custom trek, show the access URL
        if (savedTrek.isCustom && savedTrek.customAccessUrl) {
          setCustomAccessUrl(savedTrek.customAccessUrl);
          toast.info('Custom trek created! Share this link with your customer: ' + savedTrek.customAccessUrl);
        }
      }
      navigate('/admin/treks');
    } catch (error) {
      console.error('Error saving trek:', error);
      if (error.response?.data?.errors) {
        // Handle validation errors from the backend
        const backendErrors = error.response.data.errors;
        setFormErrors(prev => ({
          ...prev,
          ...Object.keys(backendErrors).reduce((acc, key) => {
            acc[key] = backendErrors[key].message;
            return acc;
          }, {})
        }));
        toast.error('Please fix the validation errors.');
      } else {
        toast.error(`Error saving trek: ${error.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <div className="mb-6 flex items-center justify-between">
         <Button variant="secondary" onClick={() => navigate('/admin/treks')} icon={FaArrowLeft}>
           Back to Treks
         </Button>
         <h1 className="text-2xl font-semibold text-gray-800">
           {id ? 'Edit Trek' : 'Create New Trek'}
         </h1>
         <div></div>
       </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <FormSection title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Trek Name" id="name" value={formData.name} onChange={handleInputChange} required error={formErrors.name} placeholder="e.g., Everest Base Camp Trek" />
            <SelectField label="Region" id="region" value={formData.region} onChange={handleInputChange} required error={formErrors.region}>
              <option value="">Select Region</option>
              {regions.map(region => <option key={region._id} value={region._id}>{region.name}</option>)}
            </SelectField>
            <SelectField label="Difficulty" id="difficulty" value={formData.difficulty} onChange={handleInputChange}>
              <option>Easy</option> <option>Moderate</option> <option>Difficult</option> <option>Challenging</option>
            </SelectField>
            <InputField label="Duration (days)" id="duration" type="number" min="1" value={formData.duration} onChange={handleInputChange} required error={formErrors.duration} />
            <div>
              <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1">
                Best Seasons *
              </label>
              <MultiSelectDropdown
                options={['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter', 'Year-round']}
                value={formData.season}
                onChange={(value) => setFormData(prev => ({ ...prev, season: value }))}
                placeholder="Select seasons"
                error={formErrors.season}
              />
            </div>
            <InputField label="Display Price (INR)" id="displayPrice" type="number" min="0" step="0.01" value={formData.displayPrice} onChange={handleInputChange} required error={formErrors.displayPrice} placeholder="e.g., 26999" />
            <InputField label="Striked Price (INR)" id="strikedPrice" type="number" min="0" step="0.01" value={formData.strikedPrice} onChange={handleInputChange} error={formErrors.strikedPrice} placeholder="e.g., 29999" />
            <InputField label="Starting Point" id="startingPoint" value={formData.startingPoint} onChange={handleInputChange} placeholder="e.g., Lukla" />
            <InputField label="Ending Point" id="endingPoint" value={formData.endingPoint} onChange={handleInputChange} placeholder="e.g., Lukla" />
            {/* GST Section */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                GST <span title="Goods and Services Tax" className="text-xs text-gray-400">&#9432;</span>
              </label>
              <div className="flex flex-col gap-2">
                <InputField label="GST %" id="gstPercent" type="number" min="0" max="100" value={formData.gstPercent} onChange={handleInputChange} placeholder="e.g., 5" style={{maxWidth: '120px'}} />
                <div className="flex gap-4 mt-1">
                  <label className={`flex items-center border rounded-xl px-6 py-3 cursor-pointer text-base font-medium transition-all duration-150 ${formData.gstType === 'included' ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-300 bg-white'}`}> 
                    <input type="radio" name="gstType" value="included" checked={formData.gstType === 'included'} onChange={handleInputChange} className="mr-2 accent-emerald-600" /> Price includes GST
                  </label>
                  <label className={`flex items-center border rounded-xl px-6 py-3 cursor-pointer text-base font-medium transition-all duration-150 ${formData.gstType === 'excluded' ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-300 bg-white'}`}> 
                    <input type="radio" name="gstType" value="excluded" checked={formData.gstType === 'excluded'} onChange={handleInputChange} className="mr-2 accent-emerald-600" /> Price excludes GST
                  </label>
                </div>
              </div>
            </div>
            {/* Gateway Charges Section */}
            <div className="md:col-span-2 mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                Gateway Charges <span title="Payment gateway charges" className="text-xs text-gray-400">&#9432;</span>
              </label>
              <div className="flex flex-col gap-2">
                <InputField label="Gateway %" id="gatewayPercent" type="number" min="0" max="100" value={formData.gatewayPercent} onChange={handleInputChange} placeholder="e.g., 2" style={{maxWidth: '120px'}} />
                <div className="flex gap-4 mt-1">
                  <label className={`flex items-center border rounded-xl px-6 py-3 cursor-pointer text-base font-medium transition-all duration-150 ${formData.gatewayType === 'customer' ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-300 bg-white'}`}> 
                    <input type="radio" name="gatewayType" value="customer" checked={formData.gatewayType === 'customer'} onChange={handleInputChange} className="mr-2 accent-emerald-600" /> Collect from customer
                  </label>
                  <label className={`flex items-center border rounded-xl px-6 py-3 cursor-pointer text-base font-medium transition-all duration-150 ${formData.gatewayType === 'self' ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-300 bg-white'}`}> 
                    <input type="radio" name="gatewayType" value="self" checked={formData.gatewayType === 'self'} onChange={handleInputChange} className="mr-2 accent-emerald-600" /> I will pay
                  </label>
                </div>
              </div>
            </div>
            
            {/* Partial Payment Configuration */}
            <div className="md:col-span-2 mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                Partial Payment Configuration <span title="Allow users to pay partial amount initially" className="text-xs text-gray-400">&#9432;</span>
              </label>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="partialPaymentEnabled"
                    checked={formData.partialPayment.enabled}
                    onChange={(e) => handlePartialPaymentChange('enabled', e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="partialPaymentEnabled" className="ml-2 block text-sm font-medium text-gray-900">
                    Enable Partial Payment for this trek
                  </label>
                </div>
                
                {formData.partialPayment.enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Partial Payment Amount Type
                        </label>
                        <select
                          value={formData.partialPayment.amountType}
                          onChange={(e) => handlePartialPaymentChange('amountType', e.target.value)}
                          className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                        >
                          <option value="fixed">Fixed Amount (₹)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Partial Payment Amount
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.partialPayment.amount}
                          onChange={(e) => handlePartialPaymentChange('amount', Number(e.target.value))}
                          className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                          placeholder={formData.partialPayment.amountType === 'percentage' ? 'e.g., 30' : 'e.g., 1000'}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.partialPayment.amountType === 'percentage' 
                            ? 'Percentage of total trek price' 
                            : 'Fixed amount in ₹'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Final Payment Due (days before trek)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.partialPayment.finalPaymentDueDays}
                          onChange={(e) => handlePartialPaymentChange('finalPaymentDueDays', Number(e.target.value))}
                          className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                          placeholder="e.g., 3"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="autoCancelOnDueDate"
                          checked={formData.partialPayment.autoCancelOnDueDate}
                          onChange={(e) => handlePartialPaymentChange('autoCancelOnDueDate', e.target.checked)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <label htmlFor="autoCancelOnDueDate" className="ml-2 block text-sm text-gray-900">
                          Auto-cancel if final payment not received by due date
                        </label>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Partial Payment Features:</strong>
                        <br />• Users can pay initial amount and remaining balance later
                        <br />• Automatic reminders sent before due date
                        <br />• Remaining balance payment available in "My Bookings"
                        <br />• Partial payment disabled within final payment window
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Add new fields for altitude, distance, and highlights */}
            <InputField 
              label="Maximum Altitude (meters)" 
              id="maxAltitude" 
              type="number" 
              min="0" 
              value={formData.maxAltitude} 
              onChange={handleInputChange} 
              required 
              error={formErrors.maxAltitude} 
              placeholder="e.g., 5000" 
            />
            
            <InputField 
              label="Total Distance (km)" 
              id="distance" 
              type="number" 
              min="0" 
              step="0.1" 
              value={formData.distance} 
              onChange={handleInputChange} 
              required 
              error={formErrors.distance} 
              placeholder="e.g., 50.5" 
            />
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Highlights <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {(formData.highlights || ['']).map((highlight, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={highlight}
                      onChange={(e) => {
                        const newHighlights = [...(formData.highlights || [''])];
                        newHighlights[index] = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          highlights: newHighlights
                        }));
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      placeholder={`Highlight ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newHighlights = formData.highlights.filter((_, i) => i !== index);
                        setFormData(prev => ({
                          ...prev,
                          highlights: newHighlights.length ? newHighlights : ['']
                        }));
                      }}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      highlights: [...(prev.highlights || ['']), '']
                    }));
                  }}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <FaPlus className="mr-1" /> Add Highlight
                </button>
              </div>
              {formErrors.highlights && (
                <p className="mt-1 text-xs text-red-600">{formErrors.highlights}</p>
              )}
            </div>

            {/* Custom Trek Toggle */}
            <div className="md:col-span-2">
              <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                <input
                  type="checkbox"
                  id="isCustom"
                  name="isCustom"
                  checked={formData.isCustom}
                  onChange={(e) => setFormData(prev => ({ ...prev, isCustom: e.target.checked }))}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="isCustom" className="ml-3 block text-sm font-medium text-gray-900">
                  This is a custom trek (private booking only)
                </label>
              </div>
              {formData.isCustom && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Custom Trek Features:</strong>
                    <br />• Hidden from public listings
                    <br />• 2-week expiration date
                    <br />• Simplified booking process
                    <br />• Direct confirmation after booking
                    <br />• Single custom batch
                  </p>
                </div>
              )}
            </div>

            <div className="form-group md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trek Images <span className="text-red-500">*</span>
              </label>
              <div className="mb-2">
                <p className="text-sm text-gray-500">
                  Upload multiple images for the trek. The first image will be used as the cover image.
                </p>
              </div>
              <ImageUploader
                images={formData.images || []}
                onChange={(urls) => {
                  setFormData(prev => ({
                    ...prev,
                    images: urls,
                    imageUrl: urls[0] || '' // Set the first image as the cover image
                  }));
                }}
              />
              {formErrors.imageUrl && (
                <p className="mt-1 text-xs text-red-600">{formErrors.imageUrl}</p>
              )}
            </div>
            {/* Itinerary PDF Upload */}
            <div className="form-group md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Itinerary PDF
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <label htmlFor="itineraryPdfUpload" className="inline-flex items-center px-4 py-2 border border-emerald-600 text-emerald-700 bg-emerald-50 rounded-md shadow-sm text-sm font-medium cursor-pointer hover:bg-emerald-100 transition-colors">
                    <svg className="h-5 w-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    {formData.itineraryPdfUrl ? 'Replace PDF' : 'Upload PDF'}
                    <input
                      id="itineraryPdfUpload"
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        console.log('[PDF UPLOAD] File selected:', file);
                        setPdfUploading(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          console.log('[PDF UPLOAD] FormData created, sending POST to /upload');
                          const response = await api.post('/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          console.log('[PDF UPLOAD] Response:', response);
                          setFormData(prev => ({ ...prev, itineraryPdfUrl: response.data.url }));
                          toast.success('PDF uploaded successfully!');
                        } catch (err) {
                          console.error('[PDF UPLOAD] PDF upload failed', err);
                          toast.error('Failed to upload PDF. Please try again.');
                        } finally {
                          setPdfUploading(false);
                        }
                      }}
                    />
                  </label>
                  {pdfUploading && (
                    <span className="ml-2 text-emerald-600 flex items-center text-xs"><svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Uploading...</span>
                  )}
                  {formData.itineraryPdfUrl && !pdfUploading && (
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm2 2h4v2H8V4zm-2 4h8v8H6V8z" /></svg>
                      <a href={formData.itineraryPdfUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline text-sm font-medium">
                        View Itinerary PDF
                      </a>
                      <button type="button" onClick={async () => {
                        if (!formData.itineraryPdfUrl) return;
                        try {
                          // Extract the S3 key from the URL
                          const urlParts = formData.itineraryPdfUrl.split('.com/');
                          if (urlParts.length !== 2) throw new Error('Invalid S3 URL format');
                          const key = encodeURIComponent(urlParts[1]);
                          await api.delete(`/upload/${key}`);
                          setFormData(prev => ({ ...prev, itineraryPdfUrl: '' }));
                          toast.success('PDF deleted successfully!');
                        } catch (err) {
                          toast.error('Failed to delete PDF.');
                          console.error('Error deleting PDF:', err);
                        }
                      }} className="text-red-500 hover:underline text-xs ml-2">Remove</button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Only PDF files allowed. Max size: 5MB.</p>
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
              >
                <option value="">Select a Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{categoryNames[cat]}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <TextareaField label="Description" id="description" value={formData.description} onChange={handleInputChange} required rows={5} error={formErrors.description} placeholder="Detailed description of the trek..." />
            </div>
             <div className="flex items-center space-x-3">
               <input
                 type="checkbox"
                 id="isEnabled"
                 name="isEnabled"
                 checked={formData.isEnabled}
                 onChange={handleInputChange}
                 className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
               />
               <label htmlFor="isEnabled" className="text-sm font-medium text-gray-700">
                 Enable Trek (Visible to users)
               </label>
             </div>
          </div>
        </FormSection>

        <FormSection title="Batches">
          <AnimatePresence>
            {batches.map((batch, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className="p-4 border border-gray-200 rounded-md mb-4 bg-gray-50 relative"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <InputField label={`Start Date`} id={`batch_startDate_${index}`} type="date" value={batch.startDate} onChange={(e) => handleBatchChange(index, 'startDate', e.target.value)} required error={formErrors[`batches.${index}.startDate`]} />
                  <InputField label={`End Date`} id={`batch_endDate_${index}`} type="date" value={batch.endDate} onChange={(e) => handleBatchChange(index, 'endDate', e.target.value)} required error={formErrors[`batches.${index}.endDate`]} />
                  <InputField label={`Price (INR)`} id={`batch_price_${index}`} type="number" min="0" step="0.01" value={batch.price} onChange={(e) => handleBatchChange(index, 'price', e.target.value)} required error={formErrors[`batches.${index}.price`]} />
                  <InputField label={`Max Participants`} id={`batch_maxParticipants_${index}`} type="number" min="1" value={batch.maxParticipants} onChange={(e) => handleBatchChange(index, 'maxParticipants', e.target.value)} required error={formErrors[`batches.${index}.maxParticipants`]} />
                </div>
                {batches.length > 1 && (
                  <Button
                    variant="icon"
                    onClick={() => removeBatchField(index)}
                    className="absolute top-2 right-2 text-red-500 hover:bg-red-100"
                    aria-label="Remove batch"
                  >
                    <FaTrash />
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <Button variant="ghost" onClick={addBatchField} icon={FaPlus}>Add Batch</Button>
        </FormSection>

        <FormSection title="Itinerary">
           <AnimatePresence>
             {itinerary.map((day, dayIndex) => (
               <motion.div
                 key={dayIndex}
                 variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout
                 className="p-4 border border-gray-200 rounded-md mb-4 bg-gray-50 relative space-y-4"
               >
                 <div className="flex justify-between items-start">
                    <InputField label={`Day ${dayIndex + 1} Title`} id={`itinerary_title_${dayIndex}`} value={day.title} onChange={(e) => handleItineraryChange(dayIndex, 'title', e.target.value)} placeholder={`e.g., Arrival in Kathmandu`}/>
                    {itinerary.length > 1 && (
                       <Button variant="icon" onClick={() => removeItineraryDay(dayIndex)} className="text-red-500 hover:bg-red-100 mt-6" aria-label="Remove day"><FaTrash /></Button>
                    )}
                 </div>
                 <TextareaField label="Description" id={`itinerary_desc_${dayIndex}`} value={day.description} onChange={(e) => handleItineraryChange(dayIndex, 'description', e.target.value)} rows={3} placeholder="Detailed plan for the day..."/>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Accommodation" id={`itinerary_acc_${dayIndex}`} value={day.accommodation} onChange={(e) => handleItineraryChange(dayIndex, 'accommodation', e.target.value)} placeholder="e.g., Teahouse / Hotel"/>
                    <InputField label="Meals Included" id={`itinerary_meals_${dayIndex}`} value={day.meals} onChange={(e) => handleItineraryChange(dayIndex, 'meals', e.target.value)} placeholder="e.g., Breakfast, Lunch, Dinner"/>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Activities</label>
                    <AnimatePresence>
                       {day.activities.map((activity, activityIndex) => (
                          <motion.div key={activityIndex} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout className="flex items-center space-x-2 mb-2">
                             <InputField id={`activity_${dayIndex}_${activityIndex}`} value={activity} onChange={(e) => handleItineraryActivityChange(dayIndex, activityIndex, e.target.value)} placeholder="e.g., Sightseeing tour" className="flex-grow"/>
                             {day.activities.length > 1 && <Button variant="icon" onClick={() => removeItineraryActivity(dayIndex, activityIndex)} className="text-red-500 hover:bg-red-100" aria-label="Remove activity"><FaTrash /></Button>}
                          </motion.div>
                       ))}
                    </AnimatePresence>
                    <Button variant="ghost" size="sm" onClick={() => addItineraryActivity(dayIndex)} icon={FaPlus}>Add Activity</Button>
                 </div>
               </motion.div>
             ))}
           </AnimatePresence>
           <Button variant="ghost" onClick={addItineraryDay} icon={FaPlus}>Add Day</Button>
        </FormSection>

        <FormSection title="Includes/Excludes/ThingsToPack/FAQs">
           <FormSection title="What's Included">
              <AnimatePresence>
                 {includes.map((item, index) => (
                    <motion.div key={index} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout className="flex items-center space-x-2 mb-2">
                       <InputField id={`include_${index}`} value={item} onChange={(e) => handleListChange(setIncludes, index, e.target.value)} placeholder="e.g., Airport transfers" className="flex-grow"/>
                       {includes.length > 1 && <Button variant="icon" onClick={() => removeListField(setIncludes, index)} className="text-red-500 hover:bg-red-100" aria-label="Remove item"><FaTrash /></Button>}
                    </motion.div>
                 ))}
              </AnimatePresence>
              <Button variant="ghost" onClick={() => addListField(setIncludes, '')} icon={FaPlus}>Add Item</Button>
           </FormSection>

           <FormSection title="What's Excluded">
              <AnimatePresence>
                 {excludes.map((item, index) => (
                    <motion.div key={index} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout className="flex items-center space-x-2 mb-2">
                       <InputField id={`exclude_${index}`} value={item} onChange={(e) => handleListChange(setExcludes, index, e.target.value)} placeholder="e.g., International flights" className="flex-grow"/>
                       {excludes.length > 1 && <Button variant="icon" onClick={() => removeListField(setExcludes, index)} className="text-red-500 hover:bg-red-100" aria-label="Remove item"><FaTrash /></Button>}
                    </motion.div>
                 ))}
              </AnimatePresence>
              <Button variant="ghost" onClick={() => addListField(setExcludes, '')} icon={FaPlus}>Add Item</Button>
           </FormSection>

           <FormSection title="Things to Pack">
              <AnimatePresence>
                 {thingsToPack.map((item, index) => (
                    <motion.div key={index} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout className="p-4 border border-gray-200 rounded-md mb-4 bg-gray-50 relative space-y-3">
                       <div className="flex justify-end">
                          {thingsToPack.length > 1 && <Button variant="icon" onClick={() => removeThingsToPackField(index)} className="text-red-500 hover:bg-red-100 absolute top-2 right-2" aria-label="Remove item"><FaTrash /></Button>}
                       </div>
                       <InputField label="Item Title" id={`pack_title_${index}`} value={item.title} onChange={(e) => handleThingsToPackChange(index, 'title', e.target.value)} placeholder="e.g., Warm Jacket"/>
                       <TextareaField label="Description" id={`pack_desc_${index}`} value={item.description} onChange={(e) => handleThingsToPackChange(index, 'description', e.target.value)} rows={2} placeholder="Details about the item..."/>
                       <InputField label="Icon (Optional)" id={`pack_icon_${index}`} value={item.icon} onChange={(e) => handleThingsToPackChange(index, 'icon', e.target.value)} placeholder="e.g., jacket-icon (CSS class or name)"/>
                    </motion.div>
                 ))}
              </AnimatePresence>
              <Button variant="ghost" onClick={addThingsToPackField} icon={FaPlus}>Add Item</Button>
           </FormSection>

           <FormSection title="Frequently Asked Questions">
              <AnimatePresence>
                 {faqs.map((faq, index) => (
                    <motion.div key={index} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout className="p-4 border border-gray-200 rounded-md mb-4 bg-gray-50 relative space-y-3">
                        <div className="flex justify-end">
                           {faqs.length > 1 && <Button variant="icon" onClick={() => removeFaqField(index)} className="text-red-500 hover:bg-red-100 absolute top-2 right-2" aria-label="Remove FAQ"><FaTrash /></Button>}
                        </div>
                        <InputField label="Question" id={`faq_question_${index}`} value={faq.question} onChange={(e) => handleFaqChange(index, 'question', e.target.value)} placeholder="e.g., Is travel insurance required?"/>
                        <TextareaField label="Answer" id={`faq_answer_${index}`} value={faq.answer} onChange={(e) => handleFaqChange(index, 'answer', e.target.value)} rows={3} placeholder="Detailed answer..."/>
                    </motion.div>
                 ))}
              </AnimatePresence>
              <Button variant="ghost" onClick={addFaqField} icon={FaPlus}>Add FAQ</Button>
           </FormSection>
        </FormSection>

        <FormSection title="Add-ons">
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Add optional services or items that participants can choose during booking.</p>
            
            <AnimatePresence>
              {formData.addOns.map((addOn, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="p-4 border border-gray-200 rounded-md bg-gray-50 relative"
                >
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => removeAddOn(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Add-on Name"
                      value={addOn.name}
                      onChange={(e) => handleAddOnChange(index, 'name', e.target.value)}
                      placeholder="e.g., Camping Gear Rental"
                      required
                    />
                    <InputField
                      label="Price (INR)"
                      type="number"
                      min="0"
                      value={addOn.price}
                      onChange={(e) => handleAddOnChange(index, 'price', parseFloat(e.target.value))}
                      placeholder="e.g., 1000"
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <TextareaField
                      label="Description"
                      value={addOn.description}
                      onChange={(e) => handleAddOnChange(index, 'description', e.target.value)}
                      placeholder="Describe what this add-on includes..."
                      rows={2}
                    />
                  </div>

                  <div className="mt-4 flex items-center">
                    <input
                      type="checkbox"
                      id={`addOn_${index}_enabled`}
                      checked={addOn.isEnabled}
                      onChange={(e) => handleAddOnChange(index, 'isEnabled', e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`addOn_${index}_enabled`} className="ml-2 block text-sm text-gray-900">
                      Enable this add-on
                    </label>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              type="button"
              onClick={addAddOn}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <FaPlus className="h-4 w-4 mr-2" />
              Add New Add-on
            </button>
          </div>
        </FormSection>

        <FormSection title="Participant Information Fields" description="Specify what additional information to collect from each participant during booking">
          <div className="space-y-6">
            {formData.customFields.map((field, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <InputField
                    label="Field Name"
                    name={`customFields[${index}].fieldName`}
                    value={field.fieldName}
                    onChange={(e) => handleCustomFieldChange(index, 'fieldName', e.target.value)}
                    placeholder="e.g., PAN Number, Voter ID, Pickup Location"
                  />
                  <SelectField
                    label="Field Type"
                    name={`customFields[${index}].fieldType`}
                    value={field.fieldType}
                    onChange={(e) => handleCustomFieldChange(index, 'fieldType', e.target.value)}
                  >
                    <option value="text">Text Input</option>
                    <option value="number">Number Input</option>
                    <option value="select">Dropdown</option>
                    <option value="checkbox">Checkbox Group</option>
                  </SelectField>
                </div>
                
                <div className="mt-4">
                  <InputField
                    label="Description"
                    name={`customFields[${index}].description`}
                    value={field.description}
                    onChange={(e) => handleCustomFieldChange(index, 'description', e.target.value)}
                    placeholder="Brief description of what information to collect"
                  />
                </div>

                <div className="mt-4">
                  <InputField
                    label="Placeholder Text"
                    name={`customFields[${index}].placeholder`}
                    value={field.placeholder}
                    onChange={(e) => handleCustomFieldChange(index, 'placeholder', e.target.value)}
                    placeholder="Text to show in the input field before user types"
                  />
                </div>

                {(field.fieldType === 'select' || field.fieldType === 'checkbox') && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.fieldType === 'select' ? 'Dropdown Options' : 'Checkbox Options'}
                    </label>
                    <div className="space-y-2">
                      {field.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleCustomFieldOptionChange(index, optionIndex, e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomFieldOption(index, optionIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addCustomFieldOption(index)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Add Option
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`customFields[${index}].isRequired`}
                      checked={field.isRequired}
                      onChange={(e) => handleCustomFieldChange(index, 'isRequired', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`customFields[${index}].isRequired`} className="ml-2 block text-sm text-gray-900">
                      Required Field
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomField(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove Field
                  </button>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addCustomField}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Participant Field
            </button>
          </div>
        </FormSection>

        {/* Custom Access URL Display */}
        {customAccessUrl && (
          <FormSection title="Custom Trek Access URL">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <label className="block text-sm font-medium text-green-800 mb-2">
                Custom Trek Access URL:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={customAccessUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-green-300 rounded-md bg-white text-green-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(customAccessUrl);
                    toast.success('URL copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-sm text-green-700">
                Share this link with your customer to access the custom trek booking page.
              </p>
            </div>
          </FormSection>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button variant="secondary" onClick={() => navigate('/admin/treks')} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : id ? 'Update Trek' : 'Create Trek'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default TrekForm; 