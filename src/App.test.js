import { render, screen } from '@testing-library/react';
import App from './App';

test('renders POS system app', () => {
  render(<App />);
  // Check if the app renders without crashing
  expect(document.body).toBeInTheDocument();
});
