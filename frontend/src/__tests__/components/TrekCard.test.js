import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TrekCard from '../../components/TrekCard';

describe('TrekCard Component', () => {
  const mockTrek = {
    _id: '123',
    name: 'Test Trek',
    region: 'Himalayas',
    difficulty: 'Moderate',
    duration: 5,
    distance: 45,
    images: ['https://example.com/image.jpg'],
    basePrice: 1200
  };

  test('renders trek information correctly', () => {
    render(
      <BrowserRouter>
        <TrekCard trek={mockTrek} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Test Trek')).toBeInTheDocument();
    expect(screen.getByText('Himalayas')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('5 Days')).toBeInTheDocument();
    expect(screen.getByText('45 km')).toBeInTheDocument();
    expect(screen.getByText(/₹1,200/)).toBeInTheDocument();
  });

  test('renders default image when no images are provided', () => {
    const trekWithoutImage = { ...mockTrek, images: [] };
    
    render(
      <BrowserRouter>
        <TrekCard trek={trekWithoutImage} />
      </BrowserRouter>
    );
    
    const img = screen.getByRole('img');
    expect(img.src).toContain('placeholder');
  });

  test('links to the correct trek detail page', () => {
    render(
      <BrowserRouter>
        <TrekCard trek={mockTrek} />
      </BrowserRouter>
    );
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/treks/123');
  });
}); 