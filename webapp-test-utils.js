// =================================================================
// WEBAPP-SPECIFIC TEST UTILITIES
// =================================================================

/**
 * Webapp Testing Utilities
 * Specific utilities for testing the scheduling webapp functionality
 */

class WebappTestUtils {
  constructor() {
    this.mockGoogleScript = this.createMockGoogleScript();
    this.mockSpreadsheet = this.createMockSpreadsheet();
  }

  // Mock Google Apps Script environment
  createMockGoogleScript() {
    return {
      run: {
        withSuccessHandler: function (successCallback) {
          return {
            withFailureHandler: function (failureCallback) {
              return {
                getScheduleDataForWebApp: function (timestamp) {
                  // Simulate async call
                  setTimeout(() => {
                    successCallback(
                      mockData.generateSuccessResponse({
                        employees: mockData.generateEmployees(3),
                        shifts: mockData.generateShifts(3),
                        schedule: [],
                        weekRange: 'Dec 25 - Dec 31',
                        approvedRequests: [],
                      })
                    );
                  }, 100);
                },
                getAdminFormHtml: function (formType) {
                  setTimeout(() => {
                    successCallback('<div>Mock Admin Form</div>');
                  }, 50);
                },
                processAdminForm: function (formData) {
                  setTimeout(() => {
                    successCallback(
                      mockData.generateSuccessResponse({
                        message: 'Form processed successfully',
                      })
                    );
                  }, 100);
                },
                assignShift: function (employeeName, date, shiftName) {
                  setTimeout(() => {
                    successCallback(mockData.generateSuccessResponse());
                  }, 50);
                },
                deleteEmployee: function (email) {
                  setTimeout(() => {
                    successCallback(
                      mockData.generateSuccessResponse({
                        message: 'Employee deleted successfully',
                      })
                    );
                  }, 100);
                },
                getPendingRequests: function () {
                  setTimeout(() => {
                    successCallback(
                      mockData.generateSuccessResponse({
                        requests: mockData.generateTimeOffRequests(2),
                      })
                    );
                  }, 50);
                },
                processTimeOffRequest: function (requestId, status) {
                  setTimeout(() => {
                    successCallback(
                      mockData.generateSuccessResponse({
                        message: `Request has been ${status}`,
                      })
                    );
                  }, 50);
                },
                getMySchedule: function (timestamp) {
                  setTimeout(() => {
                    successCallback(
                      mockData.generateSuccessResponse({
                        mySchedule: [],
                        weekRange: 'Dec 25 - Dec 31',
                      })
                    );
                  }, 50);
                },
                submitTimeOffRequest: function (requestData) {
                  setTimeout(() => {
                    successCallback(
                      mockData.generateSuccessResponse({
                        message: 'Time off request submitted successfully',
                      })
                    );
                  }, 50);
                },
                getEmployeeTimeOffRequests: function () {
                  setTimeout(() => {
                    successCallback(
                      mockData.generateSuccessResponse({
                        requests: mockData.generateTimeOffRequests(1),
                      })
                    );
                  }, 50);
                },
                publishSchedule: function (timestamp) {
                  setTimeout(() => {
                    successCallback(
                      mockData.generateSuccessResponse({
                        message: 'Schedule published successfully',
                      })
                    );
                  }, 100);
                },
              };
            },
          };
        },
      },
    };
  }

  // Mock SpreadsheetApp for server-side testing
  createMockSpreadsheet() {
    const mockSheets = new Map();

    return {
      openById: function (id) {
        return {
          getSheets: function () {
            return Array.from(mockSheets.values());
          },
          getSheetByName: function (name) {
            return mockSheets.get(name) || null;
          },
          insertSheet: function (name, index = 0) {
            const sheet = createMockSheet(name);
            mockSheets.set(name, sheet);
            return sheet;
          },
          setActiveSheet: function (sheet) {
            // Mock implementation
          },
          getSpreadsheetTimeZone: function () {
            return 'America/New_York';
          },
        };
      },
    };

    function createMockSheet(name) {
      let data = [];
      let lastRow = 0;
      let lastColumn = 0;

      return {
        getName: () => name,
        getLastRow: () => lastRow,
        getLastColumn: () => lastColumn,
        getRange: function (row, col, numRows = 1, numCols = 1) {
          return {
            getValues: function () {
              const result = [];
              for (let r = row - 1; r < row - 1 + numRows; r++) {
                const rowData = [];
                for (let c = col - 1; c < col - 1 + numCols; c++) {
                  rowData.push(data[r] && data[r][c] ? data[r][c] : '');
                }
                result.push(rowData);
              }
              return result;
            },
            setValues: function (values) {
              for (let r = 0; r < values.length; r++) {
                if (!data[row - 1 + r]) data[row - 1 + r] = [];
                for (let c = 0; c < values[r].length; c++) {
                  data[row - 1 + r][col - 1 + c] = values[r][c];
                }
              }
              lastRow = Math.max(lastRow, row + values.length - 1);
              lastColumn = Math.max(lastColumn, col + values[0].length - 1);
              return this;
            },
            setValue: function (value) {
              if (!data[row - 1]) data[row - 1] = [];
              data[row - 1][col - 1] = value;
              lastRow = Math.max(lastRow, row);
              lastColumn = Math.max(lastColumn, col);
              return this;
            },
            setFontWeight: function () {
              return this;
            },
            setHorizontalAlignment: function () {
              return this;
            },
            setVerticalAlignment: function () {
              return this;
            },
            setFontSize: function () {
              return this;
            },
            setFontColor: function () {
              return this;
            },
            setBackground: function () {
              return this;
            },
            setBorder: function () {
              return this;
            },
            offset: function (rowOffset, colOffset) {
              return createMockSheet(name).getRange(
                row + rowOffset,
                col + colOffset
              );
            },
          };
        },
        getDataRange: function () {
          return this.getRange(1, 1, lastRow, lastColumn);
        },
        appendRow: function (values) {
          lastRow++;
          if (!data[lastRow - 1]) data[lastRow - 1] = [];
          values.forEach((value, index) => {
            data[lastRow - 1][index] = value;
          });
          lastColumn = Math.max(lastColumn, values.length);
        },
        deleteRow: function (rowIndex) {
          data.splice(rowIndex - 1, 1);
          lastRow = Math.max(0, lastRow - 1);
        },
        clear: function () {
          data = [];
          lastRow = 0;
          lastColumn = 0;
        },
        setFrozenRows: function () {
          return this;
        },
        setFrozenColumns: function () {
          return this;
        },
        setColumnWidth: function () {
          return this;
        },
        setColumnWidths: function () {
          return this;
        },
      };
    }
  }

  // Mock Session object
  createMockSession() {
    return {
      getActiveUser: function () {
        return {
          getEmail: function () {
            return 'test@example.com';
          },
        };
      },
      getScriptTimeZone: function () {
        return 'America/New_York';
      },
    };
  }

  // Mock HtmlService
  createMockHtmlService() {
    return {
      createTemplateFromFile: function (filename) {
        return {
          user: null,
          evaluate: function () {
            return {
              setXFrameOptionsMode: function () {
                return this;
              },
              setSandboxMode: function () {
                return this;
              },
              getContent: function () {
                return '<div>Mock HTML Content</div>';
              },
            };
          },
        };
      },
      createHtmlOutput: function (content) {
        return {
          content: content,
          setXFrameOptionsMode: function () {
            return this;
          },
          setSandboxMode: function () {
            return this;
          },
        };
      },
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' },
      SandboxMode: { IFRAME: 'IFRAME' },
    };
  }

  // Mock Utilities
  createMockUtilities() {
    return {
      getUuid: function () {
        return 'mock-uuid-' + Math.random().toString(36).substr(2, 9);
      },
      formatDate: function (date, timeZone, format) {
        if (!date) return '';
        const d = new Date(date);
        if (format === 'yyyy-MM-dd') {
          return d.toISOString().split('T')[0];
        } else if (format === 'HH:mm') {
          return d.toTimeString().substr(0, 5);
        } else if (format === 'h:mm a') {
          return d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        }
        return d.toString();
      },
    };
  }

  // Mock MailApp
  createMockMailApp() {
    const sentEmails = [];

    return {
      sendEmail: function (to, subject, body) {
        sentEmails.push({ to, subject, body, timestamp: new Date() });
      },
      getSentEmails: function () {
        return [...sentEmails];
      },
      clearSentEmails: function () {
        sentEmails.length = 0;
      },
    };
  }

  // Setup mock environment for server-side testing
  setupMockEnvironment() {
    // Mock global objects for Google Apps Script
    global.SpreadsheetApp = this.mockSpreadsheet;
    global.Session = this.createMockSession();
    global.HtmlService = this.createMockHtmlService();
    global.Utilities = this.createMockUtilities();
    global.MailApp = this.createMockMailApp();
    global.Logger = {
      log: function (message) {
        console.log(`[Logger] ${message}`);
      },
    };
  }

  // Setup mock environment for client-side testing
  setupMockClientEnvironment() {
    global.google = this.mockGoogleScript;
    global.document = domUtils.createMockDocument();
    global.alert = function (message) {
      console.log(`[Alert] ${message}`);
    };
    global.confirm = function (message) {
      console.log(`[Confirm] ${message}`);
      return true; // Default to true for testing
    };
    global.setTimeout = function (callback, delay) {
      // Execute immediately for testing
      callback();
    };
  }

  // Date testing utilities
  createTestDate(year = 2024, month = 0, day = 1) {
    return new Date(year, month, day);
  }

  getWeekStart(date) {
    const d = new Date(date);
    const dayOfWeek = d.getDay();
    const startDate = new Date(d);
    startDate.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startDate.setHours(0, 0, 0, 0);
    return startDate;
  }

  // Form testing utilities
  createMockFormSubmission(formType, data) {
    const mockForm = domUtils.createMockElement('form');
    const mockEvent = {
      target: mockForm,
      preventDefault: function () {
        this.defaultPrevented = true;
      },
    };

    // Add form data
    Object.keys(data).forEach((key) => {
      const input = domUtils.createMockElement('input', {
        name: key,
        value: data[key],
      });
      mockForm.appendChild(input);
    });

    return { form: mockForm, event: mockEvent, data };
  }

  // Validation utilities
  validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateTimeFormat(time) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  validateDateFormat(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date) && !isNaN(Date.parse(date));
  }
}

// Global webapp test utilities instance
const webappTestUtils = new WebappTestUtils();

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WebappTestUtils };
}
