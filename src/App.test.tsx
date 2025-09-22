import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders the main application with sidebar', () => {
    render(<App />);
    // Check for a key element in the Sidebar to ensure it's rendered.
    // The NavLink for Dashboard is a good candidate.
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
