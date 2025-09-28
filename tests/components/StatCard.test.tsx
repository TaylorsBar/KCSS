
import React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from '../../components/StatCard';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';


describe('StatCard', () => {
  it('renders the title, value, and unit correctly', () => {
    render(<StatCard title="Test Title" value={123.45} unit="RPM" />);

    // Check if the title is rendered
    expect(screen.getByText('Test Title')).toBeInTheDocument();

    // Check if the value is rendered
    // Use a text matcher to handle potential formatting
    expect(screen.getByText(/123.45/)).toBeInTheDocument();

    // Check if the unit is rendered
    expect(screen.getByText('RPM')).toBeInTheDocument();
  });

  it('renders correctly without a unit', () => {
    render(<StatCard title="Gear" value={4} />);
    
    expect(screen.getByText('Gear')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    // Ensure the unit is not rendered by querying for it and expecting null
    expect(screen.queryByText('RPM')).not.toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
        <StatCard title="Boost" value="1.2">
            <div data-testid="child-icon">Icon</div>
        </StatCard>
    );

    expect(screen.getByTestId('child-icon')).toBeInTheDocument();
  });
});
