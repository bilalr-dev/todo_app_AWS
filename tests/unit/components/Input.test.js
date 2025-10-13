// Unit tests for Input component
const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
require('@testing-library/jest-dom');

// Mock the Input component
const Input = ({ label, value, onChange, placeholder, type = 'text', ...props }) => {
  const [inputValue, setInputValue] = React.useState(value || '');
  
  const handleChange = (e) => {
    setInputValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };
  
  return React.createElement('div', null,
    label && React.createElement('label', { htmlFor: 'input' }, label),
    React.createElement('input', {
      id: 'input',
      type,
      value: inputValue,
      onChange: handleChange,
      placeholder,
      ...props
    })
  );
};

describe('Input Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    test('renders input with label', () => {
      render(React.createElement(Input, { label: 'Test Label' }));
      expect(screen.getByLabelText(/test label/i)).toBeInTheDocument();
    });

    test('renders input without label', () => {
      render(React.createElement(Input));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('renders input with placeholder', () => {
      render(React.createElement(Input, { placeholder: 'Enter text' }));
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    test('renders input with initial value', () => {
      render(React.createElement(Input, { value: 'Initial value' }));
      expect(screen.getByDisplayValue('Initial value')).toBeInTheDocument();
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    test('calls onChange when value changes', () => {
      const handleChange = jest.fn();
      render(React.createElement(Input, { onChange: handleChange }));
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });
      
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    test('updates value on change', () => {
      const handleChange = jest.fn();
      render(React.createElement(Input, { onChange: handleChange }));
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test input' } });
      
      expect(input.value).toBe('test input');
    });
  });

  // Input types
  describe('Input Types', () => {
    test('renders text input by default', () => {
      render(React.createElement(Input));
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    test('renders password input', () => {
      render(React.createElement(Input, { type: 'password' }));
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'password');
    });

    test('renders email input', () => {
      render(React.createElement(Input, { type: 'email' }));
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    test('associates label with input', () => {
      render(React.createElement(Input, { label: 'Username' }));
      const input = screen.getByLabelText('Username');
      expect(input).toBeInTheDocument();
    });

    test('supports keyboard navigation', () => {
      render(React.createElement(Input));
      const input = screen.getByRole('textbox');
      
      input.focus();
      expect(input).toHaveFocus();
    });

    test('handles disabled state', () => {
      render(React.createElement(Input, { disabled: true }));
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  // Props handling
  describe('Props Handling', () => {
    test('passes through additional props', () => {
      render(React.createElement(Input, { 'data-testid': 'test-input' }));
      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    test('handles required attribute', () => {
      render(React.createElement(Input, { required: true }));
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
    });

    test('handles maxLength attribute', () => {
      render(React.createElement(Input, { maxLength: 10 }));
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '10');
    });
  });
});