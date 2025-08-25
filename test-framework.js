// =================================================================
// TESTING FRAMEWORK FOR WEBAPP
// =================================================================

/**
 * Test Framework for Google Apps Script Webapp
 * Provides utilities for testing HTML, JavaScript, and server functions
 */

class TestFramework {
  constructor() {
    this.testResults = [];
    this.mockData = new MockDataGenerator();
    this.currentTestSuite = '';
  }

  // Test Suite Management
  startTestSuite(suiteName) {
    this.currentTestSuite = suiteName;
    console.log(`\n=== Starting Test Suite: ${suiteName} ===`);
  }

  endTestSuite() {
    const suiteResults = this.testResults.filter(
      (r) => r.suite === this.currentTestSuite
    );
    const passed = suiteResults.filter((r) => r.status === 'pass').length;
    const failed = suiteResults.filter((r) => r.status === 'fail').length;

    console.log(`=== Test Suite Complete: ${this.currentTestSuite} ===`);
    console.log(
      `Passed: ${passed}, Failed: ${failed}, Total: ${suiteResults.length}`
    );
    this.currentTestSuite = '';
  }

  // Test Execution
  test(testName, testFunction) {
    const testId = `${this.currentTestSuite}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    try {
      console.log(`Running: ${testName}`);
      const result = testFunction();

      if (result === true || result === undefined) {
        this.recordResult(testId, testName, 'pass', null);
        console.log(`✓ PASS: ${testName}`);
      } else {
        this.recordResult(testId, testName, 'fail', `Test returned: ${result}`);
        console.log(`✗ FAIL: ${testName} - ${result}`);
      }
    } catch (error) {
      this.recordResult(testId, testName, 'fail', error.message);
      console.log(`✗ ERROR: ${testName} - ${error.message}`);
    }
  }

  // Assertion Methods
  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`${message} Expected: ${expected}, Actual: ${actual}`);
    }
    return true;
  }

  assertNotEqual(actual, expected, message = '') {
    if (actual === expected) {
      throw new Error(
        `${message} Expected values to be different, both were: ${actual}`
      );
    }
    return true;
  }

  assertTrue(value, message = '') {
    if (value !== true) {
      throw new Error(`${message} Expected true, got: ${value}`);
    }
    return true;
  }

  assertFalse(value, message = '') {
    if (value !== false) {
      throw new Error(`${message} Expected false, got: ${value}`);
    }
    return true;
  }

  assertThrows(func, expectedError = null, message = '') {
    try {
      func();
      throw new Error(`${message} Expected function to throw an error`);
    } catch (error) {
      if (expectedError && !error.message.includes(expectedError)) {
        throw new Error(
          `${message} Expected error containing '${expectedError}', got: ${error.message}`
        );
      }
    }
    return true;
  }

  assertNotNull(value, message = '') {
    if (value === null || value === undefined) {
      throw new Error(`${message} Expected non-null value, got: ${value}`);
    }
    return true;
  }

  // Result Recording
  recordResult(testId, testName, status, error) {
    this.testResults.push({
      testId,
      testName,
      suite: this.currentTestSuite,
      status,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  // Report Generation
  generateReport() {
    const report = {
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter((r) => r.status === 'pass').length,
        failed: this.testResults.filter((r) => r.status === 'fail').length,
      },
      suites: {},
      details: this.testResults,
    };

    // Group by test suite
    this.testResults.forEach((result) => {
      if (!report.suites[result.suite]) {
        report.suites[result.suite] = { passed: 0, failed: 0, tests: [] };
      }
      report.suites[result.suite][
        result.status === 'pass' ? 'passed' : 'failed'
      ]++;
      report.suites[result.suite].tests.push(result);
    });

    return report;
  }

  // Clear all test results
  clearResults() {
    this.testResults = [];
  }
}

/**
 * Mock Data Generator for Testing
 */
class MockDataGenerator {
  constructor() {
    this.employeeCounter = 1;
    this.shiftCounter = 1;
    this.requestCounter = 1;
  }

  // Generate mock employee data
  generateEmployee(overrides = {}) {
    const defaults = {
      name: `Test Employee ${this.employeeCounter}`,
      email: `employee${this.employeeCounter}@test.com`,
      role: 'Sales Associate',
    };
    this.employeeCounter++;
    return { ...defaults, ...overrides };
  }

  generateEmployees(count = 5) {
    const employees = [];
    for (let i = 0; i < count; i++) {
      employees.push(this.generateEmployee());
    }
    return employees;
  }

  // Generate mock shift data
  generateShift(overrides = {}) {
    const shifts = [
      { name: 'Morning Shift', start: '08:00', end: '16:00' },
      { name: 'Evening Shift', start: '16:00', end: '00:00' },
      { name: 'Night Shift', start: '00:00', end: '08:00' },
    ];

    const defaults = shifts[this.shiftCounter % shifts.length];
    defaults.name = `${defaults.name} ${this.shiftCounter}`;
    this.shiftCounter++;
    return { ...defaults, ...overrides };
  }

  generateShifts(count = 3) {
    const shifts = [];
    for (let i = 0; i < count; i++) {
      shifts.push(this.generateShift());
    }
    return shifts;
  }

  // Generate mock schedule data
  generateScheduleEntry(employeeName, date, shiftName) {
    return {
      date: date instanceof Date ? date.toISOString().split('T')[0] : date,
      employeeName:
        employeeName || `Test Employee ${Math.floor(Math.random() * 5) + 1}`,
      shiftName:
        shiftName || `Morning Shift ${Math.floor(Math.random() * 3) + 1}`,
    };
  }

  generateWeekSchedule(startDate, employees, shifts) {
    const schedule = [];
    const start = new Date(startDate);

    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);

      // Randomly assign some employees to shifts
      employees.forEach((emp) => {
        if (Math.random() > 0.3) {
          // 70% chance of being scheduled
          const randomShift = shifts[Math.floor(Math.random() * shifts.length)];
          schedule.push(
            this.generateScheduleEntry(emp.name, currentDate, randomShift.name)
          );
        }
      });
    }

    return schedule;
  }

  // Generate mock time-off request
  generateTimeOffRequest(overrides = {}) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 5) + 1);

    const defaults = {
      requestId: `req_${this.requestCounter}`,
      employeeName: `Test Employee ${Math.floor(Math.random() * 5) + 1}`,
      employeeEmail: `employee${Math.floor(Math.random() * 5) + 1}@test.com`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      reason: 'Personal time off',
      status: 'Pending',
      requestDate: new Date().toISOString(),
    };

    this.requestCounter++;
    return { ...defaults, ...overrides };
  }

  generateTimeOffRequests(count = 3) {
    const requests = [];
    for (let i = 0; i < count; i++) {
      requests.push(this.generateTimeOffRequest());
    }
    return requests;
  }

  // Generate mock server responses
  generateSuccessResponse(data = {}) {
    return {
      success: true,
      ...data,
    };
  }

  generateErrorResponse(error = 'Test error') {
    return {
      success: false,
      error: error,
    };
  }

  // Reset counters
  reset() {
    this.employeeCounter = 1;
    this.shiftCounter = 1;
    this.requestCounter = 1;
  }
}

/**
 * DOM Testing Utilities
 */
class DOMTestUtils {
  // Create mock DOM elements for testing
  createMockElement(tagName, attributes = {}, innerHTML = '') {
    const element = {
      tagName: tagName.toUpperCase(),
      innerHTML: innerHTML,
      value: attributes.value || '',
      className: attributes.class || '',
      id: attributes.id || '',
      style: { display: 'block' },
      addEventListener: function (event, handler) {
        this[`on${event}`] = handler;
      },
      removeEventListener: function (event, handler) {
        delete this[`on${event}`];
      },
      querySelector: function (selector) {
        return null; // Mock implementation
      },
      querySelectorAll: function (selector) {
        return []; // Mock implementation
      },
      appendChild: function (child) {
        if (!this.children) this.children = [];
        this.children.push(child);
      },
      removeChild: function (child) {
        if (this.children) {
          const index = this.children.indexOf(child);
          if (index > -1) this.children.splice(index, 1);
        }
      },
    };

    // Add attributes
    Object.keys(attributes).forEach((key) => {
      element[key] = attributes[key];
    });

    return element;
  }

  // Mock document object
  createMockDocument() {
    return {
      getElementById: (id) => this.createMockElement('div', { id }),
      createElement: (tagName) => this.createMockElement(tagName),
      addEventListener: function (event, handler) {
        this[`on${event}`] = handler;
      },
    };
  }

  // Simulate form data
  createMockFormData(data) {
    const formData = {
      data: data,
      forEach: function (callback) {
        Object.keys(this.data).forEach((key) => {
          callback(this.data[key], key);
        });
      },
    };
    return formData;
  }

  // Simulate events
  simulateEvent(element, eventType, eventData = {}) {
    const event = {
      type: eventType,
      target: element,
      preventDefault: function () {
        this.defaultPrevented = true;
      },
      stopPropagation: function () {
        this.propagationStopped = true;
      },
      ...eventData,
    };

    if (element[`on${eventType}`]) {
      element[`on${eventType}`](event);
    }

    return event;
  }
}

// Global test framework instance
const testFramework = new TestFramework();
const mockData = new MockDataGenerator();
const domUtils = new DOMTestUtils();

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestFramework, MockDataGenerator, DOMTestUtils };
}
