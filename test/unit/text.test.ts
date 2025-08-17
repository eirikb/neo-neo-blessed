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

// Use our minimal element implementation for testing
vi.mock('../../lib/widgets/element.js', async () => {
  const elementModule = await import('../../lib/widgets/element.js');
  return elementModule;
});

// Now import Text after all mocks are set up
let Text: any;

describe('Text class conversion', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import to ensure mocks are applied
    const textModule = await import('../../lib/widgets/text.js');
    Text = textModule.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor behavior', () => {
    it('should create Text instance with factory function', () => {
      const text = Text();

      expect(text).toBeDefined();
      expect(text.type).toBe('text');
    });

    it('should create Text instance with new operator', () => {
      const text = new Text();

      expect(text).toBeDefined();
      expect(text.type).toBe('text');
    });

    it('should call Element constructor with options', () => {
      const options = { content: 'Hello, World!' };

      const text = new Text(options);

      // Text should have inherited from Element and have Element's properties
      expect(text.type).toBe('text'); // Text overrides Element's type
      expect(text.options).toBeDefined();
      expect(text.children).toBeDefined();
      expect(text.options.content).toBe('Hello, World!');
    });

    it('should handle empty options', () => {
      const text = new Text();

      expect(text.options).toBeDefined();
      expect(text.type).toBe('text');
    });

    it('should handle null/undefined options', () => {
      const text1 = new Text(null);
      const text2 = new Text(undefined);

      expect(text1.options).toBeDefined();
      expect(text2.options).toBeDefined();
      expect(text1.type).toBe('text');
      expect(text2.type).toBe('text');
    });
  });

  describe('Shrink behavior', () => {
    it('should default to shrink: true', () => {
      const text = new Text();

      // Text should default to shrinking content
      expect(text.options.shrink).toBe(true);
      expect(text.shrink).toBe(true);
    });

    it('should respect explicit shrink: false', () => {
      const text = new Text({ shrink: false });

      expect(text.options.shrink).toBe(false);
      expect(text.shrink).toBe(false);
    });

    it('should respect explicit shrink: true', () => {
      const text = new Text({ shrink: true });

      expect(text.options.shrink).toBe(true);
      expect(text.shrink).toBe(true);
    });

    it('should handle shrink string values', () => {
      const text = new Text({ shrink: 'both' });

      expect(text.options.shrink).toBe('both');
      expect(text.shrink).toBe('both');
    });

    it('should not override existing shrink in options', () => {
      const options = {
        shrink: false,
        content: 'No shrinking',
      };

      const text = new Text(options);

      // Should preserve the explicit shrink: false
      expect(text.options.shrink).toBe(false);
      expect(text.shrink).toBe(false);
    });
  });

  describe('Inheritance chain', () => {
    it('should extend Element', () => {
      const text = new Text();

      // Check that Text has Element-like properties
      expect(text.children).toBeDefined();
      expect(text.parent).toBeDefined();
      expect(text.screen).toBeDefined();
      expect(text.position).toBeDefined();
      expect(text.style).toBeDefined();
      expect(text.padding).toBeDefined();
      expect(typeof text.emit).toBe('function');
      expect(typeof text.on).toBe('function');
    });

    it('should have correct type', () => {
      const text = new Text();

      expect(text.type).toBe('text');
    });

    it('should inherit Element methods', () => {
      const text = new Text();

      // These methods should be available from Element
      expect(typeof text.hide).toBe('function');
      expect(typeof text.show).toBe('function');
      expect(typeof text.toggle).toBe('function');
      expect(typeof text.focus).toBe('function');
      expect(typeof text.setContent).toBe('function');
      expect(typeof text.getContent).toBe('function');
    });

    it('should have focused getter', () => {
      const text = new Text();

      // Should have Element's focused getter
      expect(typeof text.focused).toBe('boolean');
    });
  });

  describe('Text-specific behavior', () => {
    it('should inherit all Element positioning', () => {
      const options = {
        left: 5,
        top: 2,
        width: 'shrink', // Text often uses shrink dimensions
        height: 'shrink',
      };

      const text = new Text(options);

      // Should have all Element positioning functionality
      expect(text.options.left).toBe(5);
      expect(text.options.top).toBe(2);
      expect(text.options.width).toBe('shrink');
      expect(text.options.height).toBe('shrink');
      expect(text.shrink).toBe(true); // Should be true due to shrink dimensions
    });

    it('should inherit all Element styling', () => {
      const options = {
        content: 'Styled text',
        style: {
          fg: 'green',
          bg: 'black',
          bold: true,
        },
        padding: { left: 1, right: 1 },
      };

      const text = new Text(options);

      // Should inherit all Element styling functionality
      expect(text.options.style).toBeDefined();
      expect(text.options.content).toBe('Styled text');
      expect(text.padding.left).toBe(1);
      expect(text.padding.right).toBe(1);
    });

    it('should handle text content properly', () => {
      const text = new Text({ content: 'Hello, Text!' });

      // Should have Element's content handling
      expect(typeof text.setContent).toBe('function');
      expect(typeof text.getContent).toBe('function');

      text.setContent('New text content');
      expect(text.content).toBe('New text content');
    });

    it('should work well for labels and display text', () => {
      const labelText = new Text({
        content: 'Label:',
        shrink: true,
        style: { bold: true },
      });

      const valueText = new Text({
        content: 'Some value',
        shrink: true,
        left: 10,
      });

      // Text widgets are commonly used for labels and values
      expect(labelText.type).toBe('text');
      expect(valueText.type).toBe('text');
      expect(labelText.shrink).toBe(true);
      expect(valueText.shrink).toBe(true);
      expect(valueText.options.left).toBe(10);
    });
  });

  describe('Factory function compatibility', () => {
    it('should work with factory function call', () => {
      const text = Text({ content: 'Factory text' });

      expect(text).toBeDefined();
      expect(text.options.content).toBe('Factory text');
      expect(text.type).toBe('text');
      expect(text.shrink).toBe(true); // Default shrink
    });

    it('should work with new operator', () => {
      const text = new Text({ content: 'New text' });

      expect(text).toBeDefined();
      expect(text.options.content).toBe('New text');
      expect(text.type).toBe('text');
      expect(text.shrink).toBe(true); // Default shrink
    });

    it('should return same result for both calling methods', () => {
      const options = {
        content: 'Test content',
        shrink: false,
        style: { fg: 'blue' },
        left: 5,
        top: 3,
      };

      const factoryText = Text(options);
      const newText = new Text(options);

      // Both should have same structure (though different instances)
      expect(factoryText.options.content).toBe(newText.options.content);
      expect(factoryText.options.shrink).toBe(newText.options.shrink);
      expect(factoryText.options.left).toBe(newText.options.left);
      expect(factoryText.options.top).toBe(newText.options.top);
      expect(factoryText.type).toBe(newText.type);
      expect(factoryText.shrink).toBe(newText.shrink);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed options gracefully', () => {
      const malformedOptions = [null, undefined, 'string', 123, [], true];

      malformedOptions.forEach(options => {
        expect(() => new Text(options as any)).not.toThrow();
        const text = new Text(options as any);
        expect(text.type).toBe('text');
        expect(text.shrink).toBe(true); // Should still get default shrink
      });
    });

    it('should handle missing properties in options', () => {
      const incompleteOptions = {
        // Missing most properties
        someUnknownProp: 'value',
      };

      const text = new Text(incompleteOptions);

      expect(text.options).toBeDefined();
      expect(text.type).toBe('text');
      expect(text.shrink).toBe(true); // Default shrink behavior
    });
  });

  describe('Common text use cases', () => {
    it('should work well for simple labels', () => {
      const label = new Text({
        content: 'Name:',
        left: 0,
        top: 0,
      });

      expect(label.type).toBe('text');
      expect(label.shrink).toBe(true); // Good for labels
      expect(label.content).toBe('Name:');
    });

    it('should work well for status displays', () => {
      const status = new Text({
        content: 'Status: Ready',
        style: { fg: 'green', bold: true },
        shrink: true,
      });

      expect(status.type).toBe('text');
      expect(status.shrink).toBe(true);
      expect(status.options.style.fg).toBe('green');
    });

    it('should support multiline text', () => {
      const multiline = new Text({
        content: 'Line 1\nLine 2\nLine 3',
        shrink: false, // Don't shrink for multiline
        width: 20,
      });

      expect(multiline.type).toBe('text');
      expect(multiline.shrink).toBe(false);
      expect(multiline.content).toContain('\n');
    });
  });
});
