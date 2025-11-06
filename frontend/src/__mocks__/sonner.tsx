import React from 'react';

export const Toaster = () => <div data-testid="toaster" />;
export const toast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  loading: jest.fn(),
  promise: jest.fn(),
  custom: jest.fn(),
  message: jest.fn(),
  dismiss: jest.fn(),
};
