import '@testing-library/jest-dom';

// Mock Electron APIs
Object.defineProperty(window, 'electronAPI', {
  value: {
    openFile: jest.fn(),
    saveFile: jest.fn(),
    showMessageBox: jest.fn(),
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));