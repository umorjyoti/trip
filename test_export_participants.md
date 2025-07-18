# Test Export Participants with Emergency Contact Custom Fields

## Overview
This document outlines how to test the enhanced export functionality that includes emergency contact custom fields.

## Test Steps

### 1. Create a Trek with Custom Fields
1. Go to Admin Dashboard > Trek Management
2. Create a new trek or edit an existing one
3. Add custom fields including emergency contact related fields:
   - Field Name: "Emergency Contact Address"
   - Field Type: "text"
   - Required: true
   
   - Field Name: "Emergency Contact Email"
   - Field Type: "text"
   - Required: false

### 2. Create a Booking with Custom Field Data
1. Book the trek with participants
2. Fill in the custom fields during booking
3. Ensure emergency contact information is provided

### 3. Test Export Functionality
1. Go to Batch Performance page for the trek
2. Click "Export Participants" button
3. Verify that:
   - Emergency contact fields appear in the "Emergency Contact" category
   - Custom fields are properly categorized
   - Priority fields are selected by default
   - All fields can be selected/deselected

### 4. Verify PDF Export
1. Select fields including emergency contact custom fields
2. Click "Export PDF"
3. Verify that:
   - PDF is generated successfully
   - Emergency contact custom fields are included
   - Data is properly formatted
   - Headers are correct

## Expected Results

### Frontend
- Custom fields should be automatically categorized based on field names
- Emergency contact related custom fields should appear in "Emergency Contact" category
- Priority fields should be selected by default
- Field types and required status should be displayed

### Backend
- Custom fields should be properly extracted from participant data
- Emergency contact custom fields should be included in export
- Multiple data sources should be checked (Map, object, customFieldResponses)
- Array values should be properly joined

### PDF Output
- All selected fields should be included
- Custom field headers should use the field name
- Data should be properly formatted
- Emergency contact custom fields should be visible

## Troubleshooting

### If custom fields don't appear:
1. Check that trek has custom fields defined
2. Verify that booking has custom field data
3. Check browser console for errors
4. Verify API response includes custom fields

### If data is missing in PDF:
1. Check participant data structure
2. Verify custom field mapping
3. Check backend logs for errors
4. Ensure field names match exactly

## Notes
- Custom fields are automatically categorized based on field names
- Emergency contact fields are prioritized in default selection
- Maximum 10 fields can be exported at once
- Custom fields support text, number, select, and checkbox types 