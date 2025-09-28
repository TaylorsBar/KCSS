# Application Testing Strategy

This document outlines the testing strategy for the CartelWorxEvo2 application, designed to ensure code quality, prevent regressions, and improve maintainability.

## 1. Technology Stack

-   **Test Runner:** [Vitest](https://vitest.dev/) - A modern, fast, and Jest-compatible test runner built on top of Vite. It's an excellent choice for its speed and simple configuration.
-   **Testing Library:** [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - A library for testing React components in a way that resembles how users interact with them, promoting more robust and user-centric tests.

## 2. Setup Instructions

To run the tests, you will need a Node.js environment and a package manager like `npm` or `yarn`.

1.  **Install Dependencies:**
    Create a `package.json` file if one doesn't exist (`npm init -y`) and install the required development dependencies:

    ```bash
    npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom
    ```

2.  **Configure Vitest:**
    Create a `vite.config.ts` (or `.js`) file in the root of your project with the following content:

    ```typescript
    /// <reference types="vitest" />
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react'; // You might need to install this: npm i -D @vitejs/plugin-react

    export default defineConfig({
      plugins: [react()],
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './tests/setup.ts', // Optional setup file
      },
    });
    ```

3.  **Add Test Scripts to `package.json`:**

    ```json
    "scripts": {
      "test": "vitest",
      "test:ui": "vitest --ui",
      "coverage": "vitest run --coverage"
    }
    ```

## 3. Types of Tests

The `/tests` directory contains examples of three primary types of tests that should be written for the application.

### a. Component Unit Tests

-   **File:** `tests/components/StatCard.test.tsx`
-   **Purpose:** To test individual, isolated UI components. These tests ensure that components render correctly given a specific set of props.
-   **Strategy:** Render the component with various props and use `screen` queries from React Testing Library to assert that the expected text and elements are present in the document.

### b. Custom Hook Tests

-   **File:** `tests/hooks/useAnimatedValue.test.ts`
-   **Purpose:** To test the logic encapsulated within custom hooks, especially those with complex, time-based, or asynchronous behavior.
-   **Strategy:** Use the `renderHook` utility from React Testing Library to test the hook in isolation. For hooks involving timers or animations (like `useAnimatedValue`), use Vitest's fake timers (`vi.useFakeTimers()`) to control the passage of time and assert that the hook's return values change as expected.

### c. Integration Tests

-   **File:** `tests/pages/Diagnostics.integration.test.tsx`
-   **Purpose:** To test how multiple components and services work together to fulfill a user flow. This is crucial for verifying end-to-end functionality.
-   **Strategy:**
    1.  Render a full page or a significant feature component.
    2.  Mock any external dependencies, such as the global `fetch` API, using `vi.fn()`. This allows you to control the data returned from the "backend" and test how the UI reacts to different scenarios (success, error, loading).
    3.  Simulate user interactions like typing (`fireEvent.change`) and clicking (`fireEvent.click`).
    4.  Use `waitFor` to handle asynchronous updates and assert that the UI updates correctly after the API call resolves.

By following this comprehensive testing strategy, we can build a more resilient, reliable, and high-quality application.
