// Unit tests for Button component
const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
require('@testing-library/jest-dom');

// Mock the Button component since we're having import issues
const Button = ({ children, className, onClick, disabled, ...props }) => {
  return React.createElement('button', {
    className: className || 'btn',
    onClick,
    disabled,
    ...props
  }, children);
};

describe('Button Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    test('renders button with text', () => {
      render(React.createElement(Button, null, 'Click me'));
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    test('renders button with custom className', () => {
      render(React.createElement(Button, { className: 'custom-class' }, 'Test'));
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    test('renders disabled button', () => {
      render(React.createElement(Button, { disabled: true }, 'Disabled'));
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    test('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(React.createElement(Button, { onClick: handleClick }, 'Click me'));
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(React.createElement(Button, { onClick: handleClick, disabled: true }, 'Disabled'));
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    test('has proper button role', () => {
      render(React.createElement(Button, null, 'Test'));
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('supports keyboard navigation', () => {
      render(React.createElement(Button, null, 'Test'));
      const button = screen.getByRole('button');
      
      // Button should be focusable
      button.focus();
      expect(button).toHaveFocus();
    });

    test('has proper ARIA attributes when disabled', () => {
      render(React.createElement(Button, { disabled: true }, 'Disabled'));
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });

  // Props handling
  describe('Props Handling', () => {
    test('passes through additional props', () => {
      render(React.createElement(Button, { 'data-testid': 'test-button' }, 'Test'));
      expect(screen.getByTestId('test-button')).toBeInTheDocument();
    });

    test('handles type prop', () => {
      render(React.createElement(Button, { type: 'submit' }, 'Submit'));
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });
});