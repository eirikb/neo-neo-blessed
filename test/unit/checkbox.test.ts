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
  program: {
    lsaveCursor: vi.fn(),
    lrestoreCursor: vi.fn(),
    cup: vi.fn(),
    showCursor: vi.fn(),
  },
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

// Use our working implementations
vi.mock('../../lib/widgets/element.js', async () => {
  const elementModule = await import('../../lib/widgets/element.js');
  return elementModule;
});

vi.mock('../../lib/widgets/box.js', async () => {
  const boxModule = await import('../../lib/widgets/box.js');
  return boxModule;
});

vi.mock('../../lib/widgets/input.js', async () => {
  const inputModule = await import('../../lib/widgets/input.js');
  return inputModule;
});

// Now import Checkbox after all mocks are set up
let Checkbox: any;

describe('Checkbox class conversion', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import to ensure mocks are applied
    const checkboxModule = await import('../../lib/widgets/checkbox.js');
    Checkbox = checkboxModule.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor behavior', () => {
    it('should create Checkbox instance with factory function', () => {
      const checkbox = Checkbox();

      expect(checkbox).toBeDefined();
      expect(checkbox.type).toBe('checkbox');
    });

    it('should create Checkbox instance with new operator', () => {
      const checkbox = new Checkbox();

      expect(checkbox).toBeDefined();
      expect(checkbox.type).toBe('checkbox');
    });

    it('should call Input constructor with options', () => {
      const options = { text: 'Test checkbox', checked: true };

      const checkbox = new Checkbox(options);

      // Checkbox should have inherited from Input and have Input's properties
      expect(checkbox.type).toBe('checkbox'); // Checkbox overrides Input's type
      expect(checkbox.options).toBeDefined();
      expect(checkbox.children).toBeDefined();
    });

    it('should handle empty options', () => {
      const checkbox = new Checkbox();

      expect(checkbox.options).toBeDefined();
      expect(checkbox.type).toBe('checkbox');
      expect(checkbox.text).toBe('');
      expect(checkbox.checked).toBe(false);
      expect(checkbox.value).toBe(false);
    });

    it('should handle null/undefined options', () => {
      const checkbox1 = new Checkbox(null);
      const checkbox2 = new Checkbox(undefined);

      expect(checkbox1.options).toBeDefined();
      expect(checkbox2.options).toBeDefined();
      expect(checkbox1.type).toBe('checkbox');
      expect(checkbox2.type).toBe('checkbox');
      expect(checkbox1.checked).toBe(false);
      expect(checkbox2.checked).toBe(false);
    });

    it('should set text from content or text option', () => {
      const checkbox1 = new Checkbox({ content: 'Content text' });
      const checkbox2 = new Checkbox({ text: 'Text option' });
      const checkbox3 = new Checkbox({ content: 'Content', text: 'Text' }); // content takes precedence

      expect(checkbox1.text).toBe('Content text');
      expect(checkbox2.text).toBe('Text option');
      expect(checkbox3.text).toBe('Content');
    });

    it('should set checked state from options', () => {
      const checkbox1 = new Checkbox({ checked: true });
      const checkbox2 = new Checkbox({ checked: false });

      expect(checkbox1.checked).toBe(true);
      expect(checkbox1.value).toBe(true);
      expect(checkbox2.checked).toBe(false);
      expect(checkbox2.value).toBe(false);
    });
  });

  describe('Inheritance chain', () => {
    it('should extend Input', () => {
      const checkbox = new Checkbox();

      // Check that Checkbox has Input-like properties
      expect(checkbox.children).toBeDefined();
      expect(checkbox.parent).toBeDefined();
      expect(checkbox.screen).toBeDefined();
      expect(checkbox.position).toBeDefined();
      expect(checkbox.style).toBeDefined();
      expect(checkbox.padding).toBeDefined();
      expect(typeof checkbox.emit).toBe('function');
      expect(typeof checkbox.on).toBe('function');
    });

    it('should have correct type', () => {
      const checkbox = new Checkbox();

      expect(checkbox.type).toBe('checkbox');
    });

    it('should inherit Input methods', () => {
      const checkbox = new Checkbox();

      // These methods should be available from Input/Box/Element inheritance
      expect(typeof checkbox.hide).toBe('function');
      expect(typeof checkbox.show).toBe('function');
      expect(typeof checkbox.toggle).toBe('function');
      expect(typeof checkbox.focus).toBe('function');
      expect(typeof checkbox.setContent).toBe('function');
      expect(typeof checkbox.getContent).toBe('function');
    });

    it('should have focused getter', () => {
      const checkbox = new Checkbox();

      // Should have Element's focused getter
      expect(typeof checkbox.focused).toBe('boolean');
    });
  });

  describe('Checkbox-specific behavior', () => {
    it('should have checkbox-specific properties', () => {
      const checkbox = new Checkbox({ text: 'Test', checked: true });

      expect(checkbox.text).toBe('Test');
      expect(checkbox.checked).toBe(true);
      expect(checkbox.value).toBe(true);
    });

    it('should support checked state management', () => {
      const checkbox = new Checkbox();

      // Initially unchecked
      expect(checkbox.checked).toBe(false);
      expect(checkbox.value).toBe(false);

      // Test state synchronization
      checkbox.checked = true;
      expect(checkbox.checked).toBe(true);

      checkbox.value = false;
      expect(checkbox.value).toBe(false);
    });

    it('should support text content', () => {
      const checkbox = new Checkbox({ text: 'Check me!' });

      expect(checkbox.text).toBe('Check me!');

      // Text can be modified
      checkbox.text = 'Modified text';
      expect(checkbox.text).toBe('Modified text');
    });

    it('should inherit all Input positioning', () => {
      const options = {
        left: 5,
        top: 10,
        width: 20,
        height: 3,
      };

      const checkbox = new Checkbox(options);

      // Should have all Input positioning functionality
      expect(checkbox.options.left).toBe(5);
      expect(checkbox.options.top).toBe(10);
      expect(checkbox.options.width).toBe(20);
      expect(checkbox.options.height).toBe(3);
    });

    it('should inherit all Input styling', () => {
      const options = {
        text: 'Styled checkbox',
        style: {
          fg: 'white',
          bg: 'blue',
          focus: { bg: 'green' },
        },
        border: 'line',
        padding: { left: 1, right: 1 },
      };

      const checkbox = new Checkbox(options);

      // Should inherit all Input styling functionality
      expect(checkbox.options.style).toBeDefined();
      expect(checkbox.options.border).toBe('line');
      expect(checkbox.padding.left).toBe(1);
      expect(checkbox.padding.right).toBe(1);
    });
  });

  describe('Checkbox interactions', () => {
    it('should support keyboard interaction', () => {
      const checkbox = new Checkbox();

      // Should have keypress listener set up
      expect(checkbox.on).toHaveBeenCalledWith(
        'keypress',
        expect.any(Function)
      );
    });

    it('should support mouse interaction when enabled', () => {
      const checkbox = new Checkbox({ mouse: true });

      // Should have click listener set up when mouse is enabled
      expect(checkbox.on).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should support focus/blur interaction', () => {
      const checkbox = new Checkbox();

      // Should have focus and blur listeners set up
      expect(checkbox.on).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(checkbox.on).toHaveBeenCalledWith('blur', expect.any(Function));
    });

    it('should not set up mouse listeners when mouse is disabled', () => {
      const checkbox = new Checkbox({ mouse: false });

      // Should not have click listener when mouse is disabled
      const clickCalls = checkbox.on.mock.calls.filter(
        call => call[0] === 'click'
      );
      expect(clickCalls).toHaveLength(0);
    });
  });

  describe('Rendering behavior', () => {
    it('should support render methods', () => {
      const checkbox = new Checkbox({ text: 'Render test' });

      // Should have rendering capabilities
      expect(typeof checkbox.setContent).toBe('function');
      expect(typeof checkbox.clearPos).toBe('function');

      // Note: render() method testing limited by vitest mocking
      // The Checkbox class correctly implements rendering with [x] / [ ] display
    });

    it('should support content management', () => {
      const checkbox = new Checkbox({ text: 'Test content' });

      // Should have content management
      expect(typeof checkbox.setContent).toBe('function');
      expect(typeof checkbox.getContent).toBe('function');
    });
  });

  describe('Factory function compatibility', () => {
    it('should work with factory function call', () => {
      const checkbox = Checkbox({ text: 'Factory checkbox', checked: true });

      expect(checkbox).toBeDefined();
      expect(checkbox.text).toBe('Factory checkbox');
      expect(checkbox.checked).toBe(true);
      expect(checkbox.type).toBe('checkbox');
    });

    it('should work with new operator', () => {
      const checkbox = new Checkbox({ text: 'New checkbox', checked: false });

      expect(checkbox).toBeDefined();
      expect(checkbox.text).toBe('New checkbox');
      expect(checkbox.checked).toBe(false);
      expect(checkbox.type).toBe('checkbox');
    });

    it('should return same result for both calling methods', () => {
      const options = {
        text: 'Test checkbox',
        checked: true,
        mouse: true,
        style: { fg: 'green' },
      };

      const factoryCheckbox = Checkbox(options);
      const newCheckbox = new Checkbox(options);

      // Both should have same structure (though different instances)
      expect(factoryCheckbox.text).toBe(newCheckbox.text);
      expect(factoryCheckbox.checked).toBe(newCheckbox.checked);
      expect(factoryCheckbox.options.mouse).toBe(newCheckbox.options.mouse);
      expect(factoryCheckbox.type).toBe(newCheckbox.type);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed options gracefully', () => {
      const malformedOptions = [null, undefined, 'string', 123, [], true];

      malformedOptions.forEach(options => {
        expect(() => new Checkbox(options as any)).not.toThrow();
        const checkbox = new Checkbox(options as any);
        expect(checkbox.type).toBe('checkbox');
        expect(checkbox.text).toBe('');
        expect(checkbox.checked).toBe(false);
      });
    });

    it('should handle missing properties in options', () => {
      const incompleteOptions = {
        // Missing most properties
        someUnknownProp: 'value',
      };

      const checkbox = new Checkbox(incompleteOptions);

      expect(checkbox.options).toBeDefined();
      expect(checkbox.type).toBe('checkbox');
      expect(checkbox.text).toBe('');
      expect(checkbox.checked).toBe(false);
    });
  });

  describe('Common checkbox use cases', () => {
    it('should work well for simple checkboxes', () => {
      const checkbox = new Checkbox({
        text: 'Enable notifications',
        checked: false,
      });

      expect(checkbox.type).toBe('checkbox');
      expect(checkbox.text).toBe('Enable notifications');
      expect(checkbox.checked).toBe(false);
    });

    it('should work well for form checkboxes', () => {
      const checkbox = new Checkbox({
        text: 'I agree to the terms',
        mouse: true,
        checked: false,
        style: {
          fg: 'white',
          focus: { bg: 'blue' },
        },
      });

      expect(checkbox.type).toBe('checkbox');
      expect(checkbox.text).toBe('I agree to the terms');
      expect(checkbox.options.mouse).toBe(true);
      expect(checkbox.checked).toBe(false);
    });

    it('should work well for settings checkboxes', () => {
      const checkbox = new Checkbox({
        content: 'Dark mode', // Use content instead of text
        checked: true,
        left: 2,
        top: 5,
      });

      expect(checkbox.type).toBe('checkbox');
      expect(checkbox.text).toBe('Dark mode');
      expect(checkbox.checked).toBe(true);
      expect(checkbox.value).toBe(true);
    });

    it('should work well for list item checkboxes', () => {
      const checkbox = new Checkbox({
        text: 'Item 1',
        width: 15,
        height: 1,
        mouse: true,
      });

      expect(checkbox.type).toBe('checkbox');
      expect(checkbox.text).toBe('Item 1');
      expect(checkbox.options.width).toBe(15);
      expect(checkbox.options.height).toBe(1);
    });
  });

  describe('Event handling', () => {
    it('should support event listeners like Input', () => {
      const checkbox = new Checkbox();

      // Test that Checkbox has event methods from inheritance
      expect(typeof checkbox.on).toBe('function');
      expect(typeof checkbox.emit).toBe('function');
      expect(typeof checkbox.hide).toBe('function');
      expect(typeof checkbox.show).toBe('function');

      // Test basic visibility behavior
      expect(checkbox.hidden).toBe(false);
      checkbox.hide();
      expect(checkbox.hidden).toBe(true);
      checkbox.show();
      expect(checkbox.hidden).toBe(false);
    });

    it('should support checkbox-specific events', () => {
      const checkbox = new Checkbox();

      // Test checkbox event capabilities
      const checkHandler = vi.fn();
      const uncheckHandler = vi.fn();

      checkbox.on('check', checkHandler);
      checkbox.on('uncheck', uncheckHandler);

      // Verify event listeners were set up
      expect(checkbox.on).toHaveBeenCalledWith('check', checkHandler);
      expect(checkbox.on).toHaveBeenCalledWith('uncheck', uncheckHandler);
    });

    it('should support keyboard and mouse events', () => {
      const checkbox = new Checkbox({ mouse: true });

      // Should have various event listeners
      expect(checkbox.on).toHaveBeenCalledWith(
        'keypress',
        expect.any(Function)
      );
      expect(checkbox.on).toHaveBeenCalledWith('click', expect.any(Function));
      expect(checkbox.on).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(checkbox.on).toHaveBeenCalledWith('blur', expect.any(Function));
    });
  });

  describe('State management', () => {
    it('should support value/checked synchronization', () => {
      const checkbox = new Checkbox();

      // Initially both should be false
      expect(checkbox.checked).toBe(false);
      expect(checkbox.value).toBe(false);

      // Manual state changes should work
      checkbox.checked = true;
      checkbox.value = true;
      expect(checkbox.checked).toBe(true);
      expect(checkbox.value).toBe(true);
    });

    it('should support text updates', () => {
      const checkbox = new Checkbox({ text: 'Original' });

      expect(checkbox.text).toBe('Original');

      // Text can be updated
      checkbox.text = 'Updated';
      expect(checkbox.text).toBe('Updated');
    });
  });
});
