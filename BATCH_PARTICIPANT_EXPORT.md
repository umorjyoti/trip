# Batch Participant Export Feature

## Overview
This feature allows trekMasters to export participant details from a specific batch in PDF format. The export includes customizable fields with a maximum of 10 fields per export.

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

3. **Health & Safety**
   - Medical Conditions
   - Special Requests

4. **Booking Information**
   - Booking User Name
   - Booking User Email
   - Booking User Phone
   - Booking Date
   - Booking Status
   - Total Price

5. **Logistics**
   - Pickup Location
   - Drop Location
   - Additional Requests

6. **Custom Fields**
   - Any custom fields defined for the trek (text, number, select, checkbox)

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
   - Use "Select First 10" to quickly select the first 10 available fields
   - Use "Clear All" to deselect all fields

4. **Generate PDF**
   - Click "Export PDF" to generate and download the file
   - The PDF will be automatically downloaded with a descriptive filename

### API Endpoint

**GET** `/api/treks/:trekId/batches/:batchId/export-participants`

**Query Parameters:**
- `fields` (optional): Comma-separated list of field keys to include

**Example:**
```
GET /api/treks/64f8a1b2c3d4e5f6a7b8c9d0/batches/64f8a1b2c3d4e5f6a7b8c9d1/export-participants?fields=participantName,participantAge,bookingUserName
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

### Technical Implementation

#### Backend
- **Controller:** `trekController.exportBatchParticipants`
- **Route:** Added to `trek.routes.js`
- **Dependencies:** `pdfkit-table` for PDF generation

#### Frontend
- **Component:** `ParticipantExportModal.js`
- **API Service:** `exportBatchParticipants` function
- **Integration:** Updated `BatchPerformance.js` page

### Security
- Requires admin authentication
- Validates trek and batch ownership
- Sanitizes field selection to prevent injection

### Error Handling
- Graceful handling of missing data
- User-friendly error messages
- Fallback values for missing fields

### Custom Fields Support
The export automatically includes any custom fields defined for the trek:
- Text fields
- Number fields
- Select dropdowns
- Checkbox groups (values are joined with commas)

### Performance Considerations
- Efficient database queries with proper indexing
- Streaming PDF generation for large datasets
- Client-side field selection to reduce server load 