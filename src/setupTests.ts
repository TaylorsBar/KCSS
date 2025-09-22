import '@testing-library/jest-dom';

// Mock the SpeechRecognition API for Vitest/JSDOM environment
const mockSpeechRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  onend: vi.fn(),
  onresult: vi.fn(),
  onerror: vi.fn(),
};

// JSDOM doesn't have these APIs, so we mock them globally
(global as any).SpeechRecognition = vi.fn().mockImplementation(() => mockSpeechRecognition);
(global as any).webkitSpeechRecognition = (global as any).SpeechRecognition;

// Mock the SpeechSynthesis API
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn().mockReturnValue([]),
};

(global as any).speechSynthesis = mockSpeechSynthesis;
vi.spyOn(window, 'speechSynthesis', 'get').mockReturnValue(mockSpeechSynthesis as any);
