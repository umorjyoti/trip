# Batch Participant Export Feature

## Overview
This feature allows trekMasters to export participant details from a specific batch in PDF format. The export includes customizable fields with a maximum of 10 fields per export, with enhanced support for emergency contact custom fields.

## Features

### Field Categories
The export supports the following field categories:

1. **Participant Details**
   - Participant Name
   - Age
   - Gender
   - Contact Number

2. **Emergency Contact**
   - Emergency Contact Name
   - Emergency Contact Phone
   - Emergency Contact Relation
   - Emergency Contact Custom Fields (automatically categorized)

3. **Health & Safety**
   - Medical Conditions
   - Special Requests
   - Health-related Custom Fields

4. **Booking Information**
   - Booking User Name
   - Booking User Email
   - Booking User Phone
   - Booking Date
   - Booking Status
   - Total Price
   - Booking-related Custom Fields

5. **Logistics**
   - Pickup Location
   - Drop Location
   - Additional Requests
   - Location-related Custom Fields

6. **Custom Fields**
   - Any custom fields defined for the trek (text, number, select, checkbox)
   - Automatically categorized based on field names

### Smart Field Categorization
Custom fields are automatically categorized based on their names:
- Fields containing "emergency" or "contact" → Emergency Contact category
- Fields containing "medical", "health", or "allergy" → Health & Safety category
- Fields containing "pickup", "drop", or "location" → Logistics category
- Fields containing "booking" or "user" → Booking Information category
- Other fields → Custom Fields category

### Priority Field Selection
The system automatically prioritizes important fields for default selection:
1. Participant Name
2. Age
3. Gender
4. Emergency Contact Name
5. Emergency Contact Phone
6. Emergency Contact Relation
7. Booking User Name
8. Booking User Email
9. Booking User Phone
10. Booking Date

### How to Use

1. **Navigate to Batch Performance**
   - Go to the trek management section
   - Select a specific trek
   - Click on "Batch Performance" for the desired batch

2. **Export Participants**
   - Click the "Export Participants" button in the top-right corner
   - A modal will open with field selection options

3. **Select Fields**
   - Choose up to 10 fields you want to include in the PDF
   - Fields are organized by category for easy selection
   - Use "Select Priority Fields" to quickly select the most important fields
   - Use "Clear All" to deselect all fields
   - Custom fields show their type and required status

4. **Generate PDF**
   - Click "Export PDF" to generate and download the file
   - The PDF will be automatically downloaded with a descriptive filename

### API Endpoint

**GET** `/api/treks/:trekId/batches/:batchId/export-participants`

**Query Parameters:**
- `fields` (optional): Comma-separated list of field keys to include

**Example:**
```
GET /api/treks/64f8a1b2c3d4e5f6a7b8c9d0/batches/64f8a1b2c3d4e5f6a7b8c9d1/export-participants?fields=participantName,participantAge,emergencyContactName,custom_emergencyContactAddress
```

### Response
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename=batch-participants-{trek-name}-{date}.pdf`

### PDF Format
The generated PDF includes:
- Trek name and batch date range in the header
- Generation date
- Tabular data with selected fields
- Professional formatting with proper headers and borders
- Custom field headers use the actual field names

### Technical Implementation

#### Backend
- **Controller:** `trekController.exportBatchParticipants`
- **Route:** Added to `trek.routes.js`
- **Dependencies:** `pdfkit-table` for PDF generation
- **Enhanced Features:**
  - Multiple data source checking (Map, object, customFieldResponses)
  - Array value handling for checkbox fields
  - Improved field name matching
  - Better error handling

#### Frontend
- **Component:** `ParticipantExportModal.js`
- **API Service:** `exportBatchParticipants` function
- **Integration:** Updated `BatchPerformance.js` page
- **Enhanced Features:**
  - Smart field categorization
  - Priority field selection
  - Field type and required status display
  - Improved user experience

### Security
- Requires admin authentication
- Validates trek and batch ownership
- Sanitizes field selection to prevent injection

### Error Handling
- Graceful handling of missing data
- User-friendly error messages
- Fallback values for missing fields
- Comprehensive logging for debugging

### Custom Fields Support
The export automatically includes any custom fields defined for the trek:
- Text fields
- Number fields
- Select dropdowns
- Checkbox groups (values are joined with commas)
- Emergency contact custom fields
- Health and safety custom fields
- Logistics custom fields

### Performance Considerations
- Efficient database queries with proper indexing
- Streaming PDF generation for large datasets
- Client-side field selection to reduce server load
- Optimized field categorization

### Emergency Contact Custom Fields
Special attention is given to emergency contact related custom fields:
- Automatically categorized under "Emergency Contact"
- Prioritized in default field selection
- Properly extracted from participant data
- Included in PDF export with appropriate headers

### Recent Enhancements
- Improved custom field categorization
- Enhanced data extraction from multiple sources
- Better field name matching
- Priority field selection
- Enhanced user interface with field type indicators
- Comprehensive error handling and logging 