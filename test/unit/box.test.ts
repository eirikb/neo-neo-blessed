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

// Mock Node as a function constructor to work with Element.call()
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

  this.emit = vi.fn();
  this.on = vi.fn();
  this.addListener = vi.fn();
  this.removeListener = vi.fn();
  this.insert = vi.fn();
  this.append = vi.fn();
  this.prepend = vi.fn();
  this.remove = vi.fn();
  this.detach = vi.fn();
  this.destroy = vi.fn();
  this.forDescendants = vi.fn();
  this.forAncestors = vi.fn();
  this.get = vi.fn((name: string, defaultValue?: any) => defaultValue);
  this.set = vi.fn((name: string, value: any) => value);
}

vi.mock('../../lib/widgets/node.js', () => ({
  __esModule: true,
  default: MockNode,
}));

// Mock Element - function constructor that extends MockNode
function MockElement(this: any, options?: any) {
  // Call MockNode constructor
  MockNode.call(this, options);

  this.type = 'element';
  this.name = options?.name;
  this.position = {};
  this.style = {};
  this.hidden = false;
  this.padding = { left: 0, top: 0, right: 0, bottom: 0 };
  this.border = options?.border;
  this.content = options?.content || '';
}

// Set up prototype inheritance
MockElement.prototype = Object.create(MockNode.prototype);
MockElement.prototype.constructor = MockElement;

// Add Element-specific getter
Object.defineProperty(MockElement.prototype, 'focused', {
  get: function () {
    return this.screen.focused === this;
  },
});

MockElement.prototype.hide = function () {
  this.hidden = true;
  this.emit('hide');
};

MockElement.prototype.show = function () {
  this.hidden = false;
  this.emit('show');
};

MockElement.prototype.toggle = function () {
  return this.hidden ? this.show() : this.hide();
};

MockElement.prototype.focus = function () {
  return (this.screen.focused = this);
};

MockElement.prototype.setContent = function (content: string) {
  this.content = content;
  this.emit('set content');
};

MockElement.prototype.getContent = function () {
  return this.content || '';
};

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

// Now import Box after all mocks are set up
let Box: any;

describe('Box class conversion', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import to ensure mocks are applied
    const boxModule = await import('../../lib/widgets/box.js');
    Box = boxModule.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor behavior', () => {
    it('should create Box instance with factory function', () => {
      const box = Box();

      expect(box).toBeDefined();
      expect(box.type).toBe('box');
    });

    it('should create Box instance with new operator', () => {
      const box = new Box();

      expect(box).toBeDefined();
      expect(box.type).toBe('box');
    });

    it('should call Element constructor with options', () => {
      const options = { name: 'test-box', width: 80, height: 24 };

      const box = new Box(options);

      // Box should have inherited from Element and have Element's properties
      expect(box.type).toBe('box'); // Box overrides Element's type
      expect(box.options).toBeDefined();
      expect(box.children).toBeDefined();
      expect(box.name).toBe('test-box');
    });

    it('should handle empty options', () => {
      const box = new Box();

      expect(box.options).toBeDefined();
      expect(box.type).toBe('box');
    });

    it('should handle null/undefined options', () => {
      const box1 = new Box(null);
      const box2 = new Box(undefined);

      expect(box1.options).toBeDefined();
      expect(box2.options).toBeDefined();
      expect(box1.type).toBe('box');
      expect(box2.type).toBe('box');
    });
  });

  describe('Inheritance chain', () => {
    it('should extend Element', () => {
      const box = new Box();

      // Check that Box has Element-like properties
      expect(box.children).toBeDefined();
      expect(box.parent).toBeDefined();
      expect(box.screen).toBeDefined();
      expect(box.position).toBeDefined();
      expect(box.style).toBeDefined();
      expect(box.padding).toBeDefined();
      expect(typeof box.emit).toBe('function');
      expect(typeof box.on).toBe('function');
    });

    it('should have correct type', () => {
      const box = new Box();

      expect(box.type).toBe('box');
    });

    it('should inherit Element methods', () => {
      const box = new Box();

      // These methods should be available from Element
      expect(typeof box.hide).toBe('function');
      expect(typeof box.show).toBe('function');
      expect(typeof box.toggle).toBe('function');
      expect(typeof box.focus).toBe('function');
      expect(typeof box.setContent).toBe('function');
      expect(typeof box.getContent).toBe('function');
    });

    it('should have focused getter', () => {
      const box = new Box();

      // Should have Element's focused getter
      expect(typeof box.focused).toBe('boolean');
    });
  });

  describe('Box-specific behavior', () => {
    it('should inherit all Element positioning', () => {
      const options = {
        left: 10,
        top: 5,
        width: 80,
        height: 24,
      };

      const box = new Box(options);

      // Should have all Element positioning functionality
      expect(box.options.left).toBe(10);
      expect(box.options.top).toBe(5);
      expect(box.options.width).toBe(80);
      expect(box.options.height).toBe(24);
    });

    it('should inherit all Element styling', () => {
      const options = {
        style: {
          fg: 'red',
          bg: 'blue',
          bold: true,
        },
        border: 'line',
        padding: 1,
      };

      const box = new Box(options);

      // Should inherit all Element styling functionality
      expect(box.options.style).toBeDefined();
      expect(box.options.border).toBe('line');
      // Element processes numeric padding into object form
      expect(box.padding).toEqual({
        left: 1,
        top: 1,
        right: 1,
        bottom: 1,
      });
    });

    it('should handle content like Element', () => {
      const box = new Box({ content: 'Hello, Box!' });

      // Should have Element's content handling
      expect(typeof box.setContent).toBe('function');
      expect(typeof box.getContent).toBe('function');

      box.setContent('New content');
      expect(box.content).toBe('New content');
    });

    it('should handle visibility like Element', () => {
      const box = new Box({ hidden: false });

      // Should have Element's visibility methods
      expect(box.hidden).toBe(false);

      box.hide();
      expect(box.hidden).toBe(true);

      box.show();
      expect(box.hidden).toBe(false);

      box.toggle();
      expect(box.hidden).toBe(true);
    });
  });

  describe('Factory function compatibility', () => {
    it('should work with factory function call', () => {
      const box = Box({ name: 'factory-test' });

      expect(box).toBeDefined();
      expect(box.options.name).toBe('factory-test');
      expect(box.type).toBe('box');
    });

    it('should work with new operator', () => {
      const box = new Box({ name: 'new-test' });

      expect(box).toBeDefined();
      expect(box.options.name).toBe('new-test');
      expect(box.type).toBe('box');
    });

    it('should return same result for both calling methods', () => {
      const options = {
        name: 'test',
        width: 80,
        height: 24,
        border: 'line',
        padding: 1,
        content: 'Test content',
      };

      const factoryBox = Box(options);
      const newBox = new Box(options);

      // Both should have same structure (though different instances)
      expect(factoryBox.options.name).toBe(newBox.options.name);
      expect(factoryBox.options.width).toBe(newBox.options.width);
      expect(factoryBox.options.height).toBe(newBox.options.height);
      expect(factoryBox.options.border).toBe(newBox.options.border);
      expect(factoryBox.options.padding).toBe(newBox.options.padding);
      expect(factoryBox.options.content).toBe(newBox.options.content);
      expect(factoryBox.type).toBe(newBox.type);
    });
  });

  describe('Container behavior', () => {
    it('should handle children like any Element', () => {
      const box = new Box({ name: 'parent-box' });

      // Should have Node's children handling
      expect(Array.isArray(box.children)).toBe(true);
      expect(box.children.length).toBe(0);

      // Should have methods for managing children
      expect(typeof box.append).toBe('function');
      expect(typeof box.prepend).toBe('function');
      expect(typeof box.insert).toBe('function');
      expect(typeof box.remove).toBe('function');
    });

    it('should work as a simple container', () => {
      const parentBox = new Box({
        name: 'parent',
        width: 100,
        height: 50,
      });

      const childBox = new Box({
        name: 'child',
        parent: parentBox,
        width: 50,
        height: 25,
      });

      // Basic container functionality
      expect(parentBox.type).toBe('box');
      expect(childBox.type).toBe('box');
      expect(childBox.options.parent).toBe(parentBox);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed options gracefully', () => {
      const malformedOptions = [null, undefined, 'string', 123, [], true];

      malformedOptions.forEach(options => {
        expect(() => new Box(options as any)).not.toThrow();
        const box = new Box(options as any);
        expect(box.type).toBe('box');
      });
    });

    it('should handle missing properties in options', () => {
      const incompleteOptions = {
        // Missing most properties
        someUnknownProp: 'value',
      };

      const box = new Box(incompleteOptions);

      expect(box.options).toBeDefined();
      expect(box.type).toBe('box');
    });
  });

  describe('Event handling', () => {
    it('should support event listeners like Element', () => {
      const box = new Box();

      // Test that Box has event methods from inheritance
      expect(typeof box.on).toBe('function');
      expect(typeof box.emit).toBe('function');
      expect(typeof box.hide).toBe('function');
      expect(typeof box.show).toBe('function');

      // Test basic visibility behavior
      expect(box.hidden).toBe(false);
      box.hide();
      expect(box.hidden).toBe(true);
      box.show();
      expect(box.hidden).toBe(false);
    });
  });
});
