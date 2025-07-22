import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomDropdown from '../CustomDropdown';

describe('CustomDropdown', () => {
  const mockOptions = [
    'Backpacking Trips',
    'Weekend Getaways',
    'Adventure Tours',
    'Cultural Tours',
    'Custom Tours'
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with placeholder when no value is selected', () => {
    render(
      <CustomDropdown
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        placeholder="Select trip type"
      />
    );

    expect(screen.getByText('Select trip type')).toBeTruthy();
  });

  it('renders selected value when provided', () => {
    render(
      <CustomDropdown
        options={mockOptions}
        value="Backpacking Trips"
        onChange={mockOnChange}
        placeholder="Select trip type"
      />
    );

    expect(screen.getByText('Backpacking Trips')).toBeTruthy();
  });

  it('opens dropdown when clicked', async () => {
    render(
      <CustomDropdown
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        placeholder="Select trip type"
      />
    );

    const dropdownButton = screen.getByRole('button');
    fireEvent.click(dropdownButton);

    await waitFor(() => {
      expect(screen.getByText('Backpacking Trips')).toBeTruthy();
      expect(screen.getByText('Weekend Getaways')).toBeTruthy();
      expect(screen.getByText('Adventure Tours')).toBeTruthy();
    });
  });

  it('calls onChange when option is selected', async () => {
    render(
      <CustomDropdown
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        placeholder="Select trip type"
      />
    );

    const dropdownButton = screen.getByRole('button');
    fireEvent.click(dropdownButton);

    await waitFor(() => {
      const option = screen.getByText('Backpacking Trips');
      fireEvent.click(option);
    });

    expect(mockOnChange).toHaveBeenCalledWith('Backpacking Trips');
  });

  it('closes dropdown after option selection', async () => {
    render(
      <CustomDropdown
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        placeholder="Select trip type"
      />
    );

    const dropdownButton = screen.getByRole('button');
    fireEvent.click(dropdownButton);

    await waitFor(() => {
      const option = screen.getByText('Backpacking Trips');
      fireEvent.click(option);
    });

    // Dropdown should be closed
    expect(screen.queryByText('Weekend Getaways')).toBeNull();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <CustomDropdown
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        placeholder="Select trip type"
        disabled={true}
      />
    );

    const dropdownButton = screen.getByRole('button');
    expect(dropdownButton.disabled).toBe(true);
  });

  it('shows error message when error prop is provided', () => {
    const errorMessage = 'This field is required';
    render(
      <CustomDropdown
        options={mockOptions}
        value=""
        onChange={mockOnChange}
        placeholder="Select trip type"
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeTruthy();
  });
}); 