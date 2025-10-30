import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';

test('renders GAIA header', () => {
  render(<App />);
  const headerElement = screen.getByText(/GAIA: Geospatial AI-driven Assessment/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders welcome message', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/Welcome to GAIA/i);
  expect(welcomeElement).toBeInTheDocument();
});
