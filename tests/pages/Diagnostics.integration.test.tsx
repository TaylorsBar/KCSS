
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Diagnostics from '../../pages/Diagnostics';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock the nested components and services
vi.mock('react-markdown', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../services/pdfService', () => ({
    pdfService: {
        generateDiagnosticReport: vi.fn(),
    },
}));

describe('Diagnostics Page Integration Test', () => {
  beforeEach(() => {
    // Mock the global fetch function before each test
    // FIX: In a JSDOM environment, the global object is 'window', not 'global'.
    window.fetch = vi.fn();
  });

  it('should allow a user to ask a question and receive an AI response', async () => {
    const mockApiResponse = { text: "This is a mock AI response." };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });

    render(<Diagnostics />);

    // 1. Find the input field and the send button
    const input = screen.getByPlaceholderText('Type your question here...');
    const sendButton = screen.getByRole('button', { name: /Send/i });

    // Assert initial state
    expect(screen.getByText(/Hello! I'm KC/)).toBeInTheDocument();

    // 2. Simulate user typing a question
    const userQuestion = 'Why is my engine running rough?';
    fireEvent.change(input, { target: { value: userQuestion } });

    // 3. Simulate clicking the send button
    fireEvent.click(sendButton);

    // 4. Assert that the user's message appears on the screen
    await waitFor(() => {
      expect(screen.getByText(userQuestion)).toBeInTheDocument();
    });

    // 5. Assert that the button is disabled and shows "Sending..."
    expect(sendButton).toBeDisabled();
    expect(screen.getByText('Sending...')).toBeInTheDocument();

    // 6. Assert that the fetch API was called correctly
    expect(fetch).toHaveBeenCalledWith('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'DIAGNOSTIC_ANSWER', query: userQuestion }),
    });

    // 7. Assert that the AI's response is displayed after the API call resolves
    await waitFor(() => {
      expect(screen.getByText(mockApiResponse.text)).toBeInTheDocument();
    });

    // 8. Assert that the button is re-enabled and the input is cleared
    expect(sendButton).not.toBeDisabled();
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('should display an error message if the API call fails', async () => {
    (fetch as any).mockRejectedValue(new Error('API is down'));

    render(<Diagnostics />);
    
    const input = screen.getByPlaceholderText('Type your question here...');
    const sendButton = screen.getByRole('button', { name: /Send/i });

    fireEvent.change(input, { target: { value: 'Test question' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
        expect(screen.getByText("Sorry, I couldn't get a response. Please check your connection and try again.")).toBeInTheDocument();
    });
  });
});