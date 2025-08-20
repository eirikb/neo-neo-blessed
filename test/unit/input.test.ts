import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create a mock screen
const mockScreen = {
  focused: null,
  total: 1,
  global: null,
  instances: [],
  _listenMouse: vi.fn(),
  _listenKeys: vi.fn(),
  clearRegion: vi.fn(),
  rewindFocus: vi.fn(),
  render: vi.fn(),
  setEffects: vi.fn(),
};

// Mock Screen constructor for Node to find
const mockScreenConstructor = {
  total: 1,
  global: mockScreen,
  instances: [mockScreen],
};

// Set up global for Node to find Screen
(global as any).BlessedScreen = mockScreenConstructor;

// Mock Node as function constructor that works with .call()
function MockNode(this: any, options?: any) {
  // Don't set type here - let the inheriting class set it
  this.options = options || {};
  this.children = [];
  this.parent = null;
  this.screen = options?.screen || mockScreen;
  this.uid = Math.floor(Math.random() * 1000000);
  this.index = -1;
  this.detached = true;
  this.data = {};
  this.$ = this.data;
  this._ = this.data;
}

// Add prototype methods that Element expects from Node
MockNode.prototype.emit = vi.fn();
MockNode.prototype.on = vi.fn();
MockNode.prototype.addListener = vi.fn();
MockNode.prototype.removeListener = vi.fn();
MockNode.prototype.insert = vi.fn();
MockNode.prototype.append = vi.fn();
MockNode.prototype.prepend = vi.fn();
MockNode.prototype.remove = vi.fn();
MockNode.prototype.detach = vi.fn();
MockNode.prototype.destroy = vi.fn();
MockNode.prototype.forDescendants = vi.fn();
MockNode.prototype.forAncestors = vi.fn();
MockNode.prototype.get = vi.fn(
  (name: string, defaultValue?: any) => defaultValue
);
MockNode.prototype.set = vi.fn((name: string, value: any) => value);

vi.mock('../../lib/widgets/node.js', () => ({
  __esModule: true,
  default: MockNode,
}));

// Mock other dependencies
vi.mock('../../lib/colors.js', () => ({
  convert: vi.fn((color: any) => color),
  match: vi.fn(() => 7),
}));

vi.mock('../../lib/unicode.js', () => ({
  strWidth: vi.fn((str: string) => str.length),
  charWidth: vi.fn(() => 1),
}));

vi.mock('../../lib/helpers.js', () => ({
  merge: vi.fn((target: any, source: any) => Object.assign(target, source)),
}));

// Set up require mock
global.require = vi.fn().mockImplementation(() => ({}));

// Use our working element and box implementations
vi.mock('../../lib/widgets/element.js', async () => {
  const elementModule = await import('../../lib/widgets/element.js');
  return elementModule;
});

vi.mock('../../lib/widgets/box.js', async () => {
  const boxModule = await import('../../lib/widgets/box.js');
  return boxModule;
});

// Now import Input after all mocks are set up
let Input: any;

describe('Input class conversion', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import to ensure mocks are applied
    const inputModule = await import('../../lib/widgets/input.js');
    Input = inputModule.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor behavior', () => {
    it('should create Input instance with factory function', () => {
      const input = Input();

      expect(input).toBeDefined();
      expect(input.type).toBe('input');
    });

    it('should create Input instance with new operator', () => {
      const input = new Input();

      expect(input).toBeDefined();
      expect(input.type).toBe('input');
    });

    it('should call Box constructor with options', () => {
      const options = { name: 'test-input', width: 20 };

      const input = new Input(options);

      // Input should have inherited from Box and have Box's properties
      expect(input.type).toBe('input'); // Input overrides Box's type
      expect(input.options).toBeDefined();
      expect(input.children).toBeDefined();
      expect(input.options.name).toBe('test-input');
    });

    it('should handle empty options', () => {
      const input = new Input();

      expect(input.options).toBeDefined();
      expect(input.type).toBe('input');
    });

    it('should handle null/undefined options', () => {
      const input1 = new Input(null);
      const input2 = new Input(undefined);

      expect(input1.options).toBeDefined();
      expect(input2.options).toBeDefined();
      expect(input1.type).toBe('input');
      expect(input2.type).toBe('input');
    });
  });

  describe('Inheritance chain', () => {
    it('should extend Box', () => {
      const input = new Input();

      // Check that Input has Box-like properties
      expect(input.children).toBeDefined();
      expect(input.parent).toBeDefined();
      expect(input.screen).toBeDefined();
      expect(input.position).toBeDefined();
      expect(input.style).toBeDefined();
      expect(input.padding).toBeDefined();
      expect(typeof input.emit).toBe('function');
      expect(typeof input.on).toBe('function');
    });

    it('should have correct type', () => {
      const input = new Input();

      expect(input.type).toBe('input');
    });

    it('should inherit Box methods', () => {
      const input = new Input();

      // These methods should be available from Box/Element inheritance
      expect(typeof input.hide).toBe('function');
      expect(typeof input.show).toBe('function');
      expect(typeof input.toggle).toBe('function');
      expect(typeof input.focus).toBe('function');
      expect(typeof input.setContent).toBe('function');
      expect(typeof input.getContent).toBe('function');
    });

    it('should have focused getter', () => {
      const input = new Input();

      // Should have Element's focused getter
      expect(typeof input.focused).toBe('boolean');
    });
  });

  describe('Input-specific behavior', () => {
    it('should inherit all Box positioning', () => {
      const options = {
        left: 10,
        top: 5,
        width: 30,
        height: 3,
      };

      const input = new Input(options);

      // Should have all Box positioning functionality
      expect(input.options.left).toBe(10);
      expect(input.options.top).toBe(5);
      expect(input.options.width).toBe(30);
      expect(input.options.height).toBe(3);
    });

    it('should inherit all Box styling', () => {
      const options = {
        style: {
          fg: 'white',
          bg: 'black',
          border: { fg: 'blue' },
        },
        border: 'line',
        padding: { left: 1, right: 1 },
      };

      const input = new Input(options);

      // Should inherit all Box styling functionality
      expect(input.options.style).toBeDefined();
      expect(input.options.border).toBe('line');
      expect(input.padding.left).toBe(1);
      expect(input.padding.right).toBe(1);
    });

    it('should work as base for input controls', () => {
      const textInput = new Input({
        name: 'username',
        content: 'Enter username...',
        width: 25,
        height: 3,
        border: 'line',
      });

      // Input is designed as base class for interactive controls
      expect(textInput.type).toBe('input');
      expect(textInput.options.name).toBe('username');
      expect(textInput.options.content).toBe('Enter username...');
    });

    it('should support keyboard interaction preparation', () => {
      const input = new Input({
        keys: true,
        mouse: true,
        clickable: true,
      });

      // Input should support interaction setup
      expect(input.type).toBe('input');
      expect(input.options.keys).toBe(true);
      expect(input.options.mouse).toBe(true);
      expect(input.options.clickable).toBe(true);
    });
  });

  describe('Factory function compatibility', () => {
    it('should work with factory function call', () => {
      const input = Input({ name: 'factory-input' });

      expect(input).toBeDefined();
      expect(input.options.name).toBe('factory-input');
      expect(input.type).toBe('input');
    });

    it('should work with new operator', () => {
      const input = new Input({ name: 'new-input' });

      expect(input).toBeDefined();
      expect(input.options.name).toBe('new-input');
      expect(input.type).toBe('input');
    });

    it('should return same result for both calling methods', () => {
      const options = {
        name: 'test',
        width: 20,
        height: 3,
        border: 'line',
        style: { fg: 'green' },
        content: 'Input text',
      };

      const factoryInput = Input(options);
      const newInput = new Input(options);

      // Both should have same structure (though different instances)
      expect(factoryInput.options.name).toBe(newInput.options.name);
      expect(factoryInput.options.width).toBe(newInput.options.width);
      expect(factoryInput.options.height).toBe(newInput.options.height);
      expect(factoryInput.options.border).toBe(newInput.options.border);
      expect(factoryInput.options.content).toBe(newInput.options.content);
      expect(factoryInput.type).toBe(newInput.type);
    });
  });

  describe('Container behavior', () => {
    it('should handle children like any Box', () => {
      const input = new Input({ name: 'container-input' });

      // Should have Box's children handling
      expect(Array.isArray(input.children)).toBe(true);
      expect(input.children.length).toBe(0);

      // Should have methods for managing children
      expect(typeof input.append).toBe('function');
      expect(typeof input.prepend).toBe('function');
      expect(typeof input.insert).toBe('function');
      expect(typeof input.remove).toBe('function');
    });

    it('should work as base for complex inputs', () => {
      const complexInput = new Input({
        name: 'complex',
        width: 40,
        height: 5,
        scrollable: false,
      });

      // Input should work as foundation for complex input controls
      expect(complexInput.type).toBe('input');
      expect(complexInput.options.name).toBe('complex');
      expect(complexInput.options.scrollable).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed options gracefully', () => {
      const malformedOptions = [null, undefined, 'string', 123, [], true];

      malformedOptions.forEach(options => {
        expect(() => new Input(options as any)).not.toThrow();
        const input = new Input(options as any);
        expect(input.type).toBe('input');
      });
    });

    it('should handle missing properties in options', () => {
      const incompleteOptions = {
        // Missing most properties
        someUnknownProp: 'value',
      };

      const input = new Input(incompleteOptions);

      expect(input.options).toBeDefined();
      expect(input.type).toBe('input');
    });
  });

  describe('Common input use cases', () => {
    it('should work well as text input base', () => {
      const textInput = new Input({
        name: 'text',
        placeholder: 'Enter text...',
        width: 30,
        height: 3,
        border: 'line',
        style: { focus: { border: { fg: 'green' } } },
      });

      expect(textInput.type).toBe('input');
      expect(textInput.options.placeholder).toBe('Enter text...');
    });

    it('should work well as button base', () => {
      const buttonBase = new Input({
        name: 'button',
        content: 'Click me',
        width: 12,
        height: 3,
        clickable: true,
        mouse: true,
        style: {
          bg: 'blue',
          fg: 'white',
          focus: { bg: 'green' },
        },
      });

      expect(buttonBase.type).toBe('input');
      expect(buttonBase.options.content).toBe('Click me');
      expect(buttonBase.options.clickable).toBe(true);
    });

    it('should work well as form field base', () => {
      const fieldInput = new Input({
        name: 'email',
        label: 'Email:',
        width: 25,
        height: 3,
        keys: true,
        border: 'line',
      });

      expect(fieldInput.type).toBe('input');
      expect(fieldInput.options.label).toBe('Email:');
      expect(fieldInput.options.keys).toBe(true);
    });
  });

  describe('Event handling', () => {
    it('should support event listeners like Box', () => {
      const input = new Input();

      // Test that Input has event methods from inheritance
      expect(typeof input.on).toBe('function');
      expect(typeof input.emit).toBe('function');
      expect(typeof input.hide).toBe('function');
      expect(typeof input.show).toBe('function');

      // Test basic visibility behavior
      expect(input.hidden).toBe(false);
      input.hide();
      expect(input.hidden).toBe(true);
      input.show();
      expect(input.hidden).toBe(false);
    });
  });
});
