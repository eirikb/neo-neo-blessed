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
vi.mock('assert', () => ({
  __esModule: true,
  default: vi.fn(),
}));

const mockColors = {
  match: vi.fn(() => 7),
  convert: vi.fn((color: any) => color),
  RGBToHex: vi.fn(() => '#ffffff'),
  hexToRGB: vi.fn(() => [255, 255, 255]),
};

const mockUnicode = {
  strWidth: vi.fn((str: string) => str.length),
  charWidth: vi.fn(() => 1),
};

const mockHelpers = {
  merge: vi.fn((target: any, source: any) => Object.assign(target, source)),
  generateTags: vi.fn(() => ({ open: '', close: '' })),
  stripTags: vi.fn((str: string) => str.replace(/{[^}]*}/g, '')),
  cleanTags: vi.fn((str: string) => str.replace(/{[^}]*}/g, '').trim()),
  escape: vi.fn((str: string) =>
    str.replace(/[{}]/g, match => (match === '{' ? '{open}' : '{close}'))
  ),
  asort: vi.fn((items: any[]) => items.sort()),
  hsort: vi.fn((items: any[]) => items.sort()),
  findFile: vi.fn(() => null),
};

vi.mock('../../lib/colors.js', () => mockColors);
vi.mock('../../lib/unicode.js', () => mockUnicode);
vi.mock('../../lib/helpers.js', () => mockHelpers);

// Mock ScrollableBox for the scrollable option test
const mockScrollableBox = vi.fn();
mockScrollableBox.prototype = {
  type: 'scrollable-box',
};

// Set up require mock for dynamic import in Element constructor
global.require = vi.fn().mockImplementation((path: string) => {
  if (path === './scrollablebox') {
    return mockScrollableBox;
  }
  return {};
});

// Now import Element after all mocks are set up
let Element: any;

describe('Element class conversion', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Use the minimal element for testing
    const elementModule = await import('../../lib/widgets/element.js');
    Element = elementModule.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor behavior', () => {
    it('should create Element instance with factory function', () => {
      const element = Element();

      expect(element).toBeDefined();
      expect(element.type).toBe('element');
    });

    it('should create Element instance with new operator', () => {
      const element = new Element();

      expect(element).toBeDefined();
      expect(element.type).toBe('element');
    });

    it('should call Node constructor with options', () => {
      const options = { name: 'test-element', width: 80 };

      const element = new Element(options);

      // Element should have inherited from Node and have Node's properties
      expect(element.type).toBe('element'); // Element overrides Node's type
      expect(element.options).toBeDefined();
      expect(element.children).toBeDefined();
    });

    it('should handle empty options', () => {
      const element = new Element();

      expect(element.options).toBeDefined();
    });

    it('should handle null/undefined options', () => {
      const element1 = new Element(null);
      const element2 = new Element(undefined);

      expect(element1.options).toBeDefined();
      expect(element2.options).toBeDefined();
    });
  });

  describe('Inheritance chain', () => {
    it('should extend Node', () => {
      const element = new Element();

      // Check that Element has Node-like properties (since we're mocking Node)
      expect(element.children).toBeDefined();
      expect(element.parent).toBeDefined();
      expect(element.screen).toBeDefined();
      expect(typeof element.emit).toBe('function');
      expect(typeof element.on).toBe('function');
    });

    it('should have correct type', () => {
      const element = new Element();

      expect(element.type).toBe('element');
    });

    it('should inherit Node methods', () => {
      const element = new Element();

      // These methods should be available from Node prototype
      expect(typeof element.emit).toBe('function');
      expect(typeof element.on).toBe('function');
      expect(typeof element.append).toBe('function');
      expect(typeof element.remove).toBe('function');
    });
  });

  describe('Position handling', () => {
    it('should create position object from individual props', () => {
      const options = {
        left: 10,
        top: 5,
        width: 80,
        height: 24,
        right: 2,
        bottom: 1,
      };

      const element = new Element(options);

      expect(element.position).toEqual({
        left: 10,
        top: 5,
        width: 80,
        height: 24,
        right: 2,
        bottom: 1,
      });
    });

    it('should use existing position object if provided', () => {
      const position = { left: 5, top: 10, width: 50, height: 20 };
      const options = { position };

      const element = new Element(options);

      expect(element.position).toBe(position);
    });

    it('should handle shrink width', () => {
      const options = { width: 'shrink', height: 30 };

      const element = new Element(options);

      expect(element.position.width).toBeUndefined();
      expect(element.position.height).toBe(30);
      expect(element.shrink).toBe(true);
    });

    it('should handle shrink height', () => {
      const options = { width: 50, height: 'shrink' };

      const element = new Element(options);

      expect(element.position.width).toBe(50);
      expect(element.position.height).toBeUndefined();
      expect(element.shrink).toBe(true);
    });

    it('should handle both shrink dimensions', () => {
      const options = { width: 'shrink', height: 'shrink' };

      const element = new Element(options);

      expect(element.position.width).toBeUndefined();
      expect(element.position.height).toBeUndefined();
      expect(element.shrink).toBe(true);
    });
  });

  describe('Style handling', () => {
    it('should use provided style object', () => {
      const style = { fg: 'red', bg: 'blue', bold: true };
      const options = { style };

      const element = new Element(options);

      expect(element.style).toBe(style);
    });

    it('should create style from individual properties', () => {
      const options = {
        fg: 'red',
        bg: 'blue',
        bold: true,
        underline: false,
        blink: true,
        inverse: false,
        invisible: true,
        transparent: false,
      };

      const element = new Element(options);

      expect(element.style).toEqual({
        fg: 'red',
        bg: 'blue',
        bold: true,
        underline: false,
        blink: true,
        inverse: false,
        invisible: true,
        transparent: false,
      });
    });

    it('should handle empty style', () => {
      const element = new Element();

      expect(element.style).toEqual({
        fg: undefined,
        bg: undefined,
        bold: undefined,
        underline: undefined,
        blink: undefined,
        inverse: undefined,
        invisible: undefined,
        transparent: undefined,
      });
    });
  });

  describe('Padding handling', () => {
    it('should handle number padding', () => {
      const options = { padding: 2 };

      const element = new Element(options);

      expect(element.padding).toEqual({
        left: 2,
        top: 2,
        right: 2,
        bottom: 2,
      });
    });

    it('should handle object padding', () => {
      const padding = { left: 1, top: 2, right: 3, bottom: 4 };
      const options = { padding };

      const element = new Element(options);

      expect(element.padding).toEqual(padding);
    });

    it('should handle partial padding object', () => {
      const options = { padding: { left: 1, top: 2 } };

      const element = new Element(options);

      expect(element.padding).toEqual({
        left: 1,
        top: 2,
        right: 0,
        bottom: 0,
      });
    });

    it('should handle no padding', () => {
      const element = new Element();

      expect(element.padding).toEqual({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
      });
    });
  });

  describe('Border handling', () => {
    it('should handle string border type', () => {
      const options = { border: 'line' };

      const element = new Element(options);

      expect(element.border.type).toBe('line');
      expect(element.border.left).toBe(true);
      expect(element.border.top).toBe(true);
      expect(element.border.right).toBe(true);
      expect(element.border.bottom).toBe(true);
    });

    it('should handle object border', () => {
      const border = {
        type: 'single',
        fg: 'red',
        bg: 'blue',
        left: false,
        top: true,
        right: true,
        bottom: false,
      };
      const options = { border };

      const element = new Element(options);

      expect(element.border.type).toBe('single');
      expect(element.border.fg).toBe('red');
      expect(element.border.bg).toBe('blue');
      expect(element.border.left).toBe(false);
      expect(element.border.top).toBe(true);
      expect(element.border.right).toBe(true);
      expect(element.border.bottom).toBe(false);
    });

    it('should handle ascii border type conversion', () => {
      const options = { border: 'ascii' };

      const element = new Element(options);

      expect(element.border.type).toBe('line');
    });

    it('should set default border properties', () => {
      const options = { border: {} };

      const element = new Element(options);

      expect(element.border.type).toBe('bg');
      expect(element.border.ch).toBe(' ');
      expect(element.border.left).toBe(true);
      expect(element.border.top).toBe(true);
      expect(element.border.right).toBe(true);
      expect(element.border.bottom).toBe(true);
    });

    it('should create border style from border properties', () => {
      const options = {
        border: {
          type: 'line',
          fg: 'red',
          bg: 'blue',
        },
      };

      const element = new Element(options);

      expect(element.style.border).toEqual({
        fg: 'red',
        bg: 'blue',
      });
    });
  });

  describe('Basic properties', () => {
    it('should set basic properties from options', () => {
      const options = {
        name: 'test-element',
        hidden: true,
        fixed: true,
        align: 'center',
        valign: 'middle',
        wrap: false,
        shrink: true,
        ch: 'X',
        noOverflow: true,
        dockBorders: true,
        shadow: true,
      };

      const element = new Element(options);

      expect(element.name).toBe('test-element');
      expect(element.hidden).toBe(true);
      expect(element.fixed).toBe(true);
      expect(element.align).toBe('center');
      expect(element.valign).toBe('middle');
      expect(element.wrap).toBe(false);
      expect(element.shrink).toBe(true);
      expect(element.ch).toBe('X');
      expect(element.noOverflow).toBe(true);
      expect(element.dockBorders).toBe(true);
      expect(element.shadow).toBe(true);
    });

    it('should set default values', () => {
      const element = new Element();

      expect(element.hidden).toBe(false);
      expect(element.fixed).toBe(false);
      expect(element.align).toBe('left');
      expect(element.valign).toBe('top');
      expect(element.wrap).toBe(true);
      expect(element.ch).toBe(' ');
    });
  });

  describe('ScrollableBox integration', () => {
    it('should handle scrollable option gracefully', () => {
      const options = { scrollable: true };

      // Our minimal implementation should not crash with scrollable option
      expect(() => new Element(options)).not.toThrow();

      const element = new Element(options);
      expect(element).toBeDefined();
      expect(element.type).toBe('element');
    });

    it('should not use ScrollableBox when scrollable is false', () => {
      const options = { scrollable: false };

      expect(() => new Element(options)).not.toThrow();

      const element = new Element(options);
      expect(element.type).toBe('element');
    });
  });

  describe('Factory function compatibility', () => {
    it('should work with factory function call', () => {
      const element = Element({ name: 'factory-test' });

      expect(element).toBeDefined();
      expect(element.name).toBe('factory-test');
      expect(element.type).toBe('element');
    });

    it('should work with new operator', () => {
      const element = new Element({ name: 'new-test' });

      expect(element).toBeDefined();
      expect(element.name).toBe('new-test');
      expect(element.type).toBe('element');
    });

    it('should return same result for both calling methods', () => {
      const options = {
        name: 'test',
        width: 80,
        height: 24,
        border: 'line',
        padding: 1,
      };

      const factoryElement = Element(options);
      const newElement = new Element(options);

      // Both should have same structure (though different instances)
      expect(factoryElement.name).toBe(newElement.name);
      expect(factoryElement.position.width).toBe(newElement.position.width);
      expect(factoryElement.position.height).toBe(newElement.position.height);
      expect(factoryElement.border.type).toBe(newElement.border.type);
      expect(factoryElement.padding.left).toBe(newElement.padding.left);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed options gracefully', () => {
      const malformedOptions = [null, undefined, 'string', 123, [], true];

      malformedOptions.forEach(options => {
        expect(() => new Element(options as any)).not.toThrow();
      });
    });

    it('should handle missing properties in options', () => {
      const incompleteOptions = {
        // Missing most properties
        someUnknownProp: 'value',
      };

      const element = new Element(incompleteOptions);

      expect(element.name).toBeUndefined();
      expect(element.hidden).toBe(false); // Should use default
      expect(element.align).toBe('left'); // Should use default
    });
  });
});
