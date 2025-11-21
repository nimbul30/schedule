function doGet(e) {
  Logger.log('doGet function is running - serving webapp.html');
  return HtmlService.createHtmlOutputFromFile('webapp')
    .setTitle('Dunhams Scheduler')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================
// GOOGLE SHEETS BACKEND FUNCTIONS
// ============================================

/**
 * Get or create the spreadsheet for data storage
 */
function getOrCreateSpreadsheet() {
  const scriptProperties = PropertiesService.getScriptProperties();
  let spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');

  if (!spreadsheetId) {
    // Create new spreadsheet
    const ss = SpreadsheetApp.create('Dunhams Scheduler Data');
    spreadsheetId = ss.getId();
    scriptProperties.setProperty('SPREADSHEET_ID', spreadsheetId);

    // Initialize sheets
    initializeSheets(ss);
    Logger.log('Created new spreadsheet: ' + spreadsheetId);
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

/**
 * Initialize all required sheets with headers
 */
function initializeSheets(ss) {
  // Users Sheet
  let usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    usersSheet = ss.insertSheet('Users');
    usersSheet.appendRow([
      'Username',
      'Password',
      'Role',
      'Display Name',
      'Created',
    ]);
    // Add default admin
    usersSheet.appendRow(['admin', 'admin123', 'manager', 'Admin', new Date()]);
  }

  // Employees Sheet
  let employeesSheet = ss.getSheetByName('Employees');
  if (!employeesSheet) {
    employeesSheet = ss.insertSheet('Employees');
    employeesSheet.appendRow(['Name', 'Email', 'Role', 'Username', 'Created']);
  }

  // Shifts Sheet
  let shiftsSheet = ss.getSheetByName('Shifts');
  if (!shiftsSheet) {
    shiftsSheet = ss.insertSheet('Shifts');
    shiftsSheet.appendRow(['Name', 'Start Time', 'End Time', 'Created']);
  }

  // Schedule Sheet
  let scheduleSheet = ss.getSheetByName('Schedule');
  if (!scheduleSheet) {
    scheduleSheet = ss.insertSheet('Schedule');
    scheduleSheet.appendRow([
      'Employee Name',
      'Date',
      'Shift Name',
      'Start Time',
      'End Time',
      'Is Custom',
      'Is Overnight',
      'Created',
    ]);
  }

  // Delete default Sheet1 if it exists
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1) {
    ss.deleteSheet(sheet1);
  }
}

// ============================================
// USER AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Validate user credentials
 */
function validateUser(username, password) {
  try {
    const ss = getOrCreateSpreadsheet();
    const usersSheet = ss.getSheetByName('Users');
    const data = usersSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (
        data[i][0].toLowerCase() === username.toLowerCase() &&
        data[i][1] === password
      ) {
        return {
          valid: true,
          role: data[i][2],
          name: data[i][3] || username,
        };
      }
    }

    return { valid: false };
  } catch (error) {
    Logger.log('Error validating user: ' + error);
    return { valid: false, error: error.message };
  }
}

/**
 * Add new user to system
 */
function addUser(username, password, role, displayName) {
  try {
    const ss = getOrCreateSpreadsheet();
    const usersSheet = ss.getSheetByName('Users');

    // Check if username already exists
    const data = usersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toLowerCase() === username.toLowerCase()) {
        return { success: false, message: 'Username already exists' };
      }
    }

    usersSheet.appendRow([username, password, role, displayName, new Date()]);
    return { success: true };
  } catch (error) {
    Logger.log('Error adding user: ' + error);
    return { success: false, error: error.message };
  }
}

// ============================================
// EMPLOYEE FUNCTIONS
// ============================================

/**
 * Get all employees
 */
function getEmployees() {
  try {
    const ss = getOrCreateSpreadsheet();
    const employeesSheet = ss.getSheetByName('Employees');
    const data = employeesSheet.getDataRange().getValues();

    const employees = [];
    for (let i = 1; i < data.length; i++) {
      employees.push({
        name: data[i][0],
        email: data[i][1],
        role: data[i][2],
        username: data[i][3],
      });
    }

    return employees;
  } catch (error) {
    Logger.log('Error getting employees: ' + error);
    return [];
  }
}

/**
 * Add new employee
 */
function addEmployee(employee) {
  try {
    const ss = getOrCreateSpreadsheet();
    const employeesSheet = ss.getSheetByName('Employees');

    employeesSheet.appendRow([
      employee.name,
      employee.email || '',
      employee.role || '',
      employee.username || '',
      new Date(),
    ]);

    // If username and password provided, add to users
    if (employee.username && employee.password) {
      addUser(employee.username, employee.password, 'employee', employee.name);
    }

    return { success: true };
  } catch (error) {
    Logger.log('Error adding employee: ' + error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete employee
 */
function deleteEmployee(employeeName) {
  try {
    const ss = getOrCreateSpreadsheet();
    const employeesSheet = ss.getSheetByName('Employees');
    const data = employeesSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === employeeName) {
        employeesSheet.deleteRow(i + 1);

        // Also delete from schedule
        deleteEmployeeSchedule(employeeName);

        return { success: true };
      }
    }

    return { success: false, message: 'Employee not found' };
  } catch (error) {
    Logger.log('Error deleting employee: ' + error);
    return { success: false, error: error.message };
  }
}

// ============================================
// SHIFT FUNCTIONS
// ============================================

/**
 * Get all shifts
 */
function getShifts() {
  try {
    const ss = getOrCreateSpreadsheet();
    const shiftsSheet = ss.getSheetByName('Shifts');
    const data = shiftsSheet.getDataRange().getValues();

    const shifts = [];
    for (let i = 1; i < data.length; i++) {
      shifts.push({
        name: data[i][0],
        start: data[i][1],
        end: data[i][2],
        startTime: data[i][1], // For compatibility
        endTime: data[i][2],
      });
    }

    return shifts;
  } catch (error) {
    Logger.log('Error getting shifts: ' + error);
    return [];
  }
}

/**
 * Add new shift
 */
function addShift(shift) {
  try {
    const ss = getOrCreateSpreadsheet();
    const shiftsSheet = ss.getSheetByName('Shifts');

    shiftsSheet.appendRow([shift.name, shift.start, shift.end, new Date()]);

    return { success: true };
  } catch (error) {
    Logger.log('Error adding shift: ' + error);
    return { success: false, error: error.message };
  }
}

// ============================================
// SCHEDULE FUNCTIONS
// ============================================

/**
 * Get schedule for date range
 */
function getSchedule(startDate, endDate) {
  try {
    const ss = getOrCreateSpreadsheet();
    const scheduleSheet = ss.getSheetByName('Schedule');
    const data = scheduleSheet.getDataRange().getValues();

    const schedule = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let i = 1; i < data.length; i++) {
      const scheduleDate = new Date(data[i][1]);

      if (scheduleDate >= start && scheduleDate <= end) {
        schedule.push({
          employeeName: data[i][0],
          date: Utilities.formatDate(
            scheduleDate,
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          ),
          shiftName: data[i][2],
          start: data[i][3],
          end: data[i][4],
          isCustom: data[i][5] === 'TRUE' || data[i][5] === true,
          isOvernight: data[i][6] === 'TRUE' || data[i][6] === true,
        });
      }
    }

    return schedule;
  } catch (error) {
    Logger.log('Error getting schedule: ' + error);
    return [];
  }
}

/**
 * Save shift assignment
 */
function saveShiftAssignment(assignment) {
  try {
    const ss = getOrCreateSpreadsheet();
    const scheduleSheet = ss.getSheetByName('Schedule');
    const data = scheduleSheet.getDataRange().getValues();

    // Remove existing assignment for this employee and date
    for (let i = data.length - 1; i >= 1; i--) {
      const scheduleDate = Utilities.formatDate(
        new Date(data[i][1]),
        Session.getScriptTimeZone(),
        'yyyy-MM-dd'
      );
      if (
        data[i][0] === assignment.employeeName &&
        scheduleDate === assignment.date
      ) {
        scheduleSheet.deleteRow(i + 1);
      }
    }

    // Add new assignment
    scheduleSheet.appendRow([
      assignment.employeeName,
      new Date(assignment.date),
      assignment.shiftName,
      assignment.start,
      assignment.end,
      assignment.isCustom || false,
      assignment.isOvernight || false,
      new Date(),
    ]);

    return { success: true };
  } catch (error) {
    Logger.log('Error saving shift assignment: ' + error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete shift assignment
 */
function deleteShiftAssignment(employeeName, date) {
  try {
    const ss = getOrCreateSpreadsheet();
    const scheduleSheet = ss.getSheetByName('Schedule');
    const data = scheduleSheet.getDataRange().getValues();

    for (let i = data.length - 1; i >= 1; i--) {
      const scheduleDate = Utilities.formatDate(
        new Date(data[i][1]),
        Session.getScriptTimeZone(),
        'yyyy-MM-dd'
      );
      if (data[i][0] === employeeName && scheduleDate === date) {
        scheduleSheet.deleteRow(i + 1);
      }
    }

    return { success: true };
  } catch (error) {
    Logger.log('Error deleting shift assignment: ' + error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete all schedule entries for an employee
 */
function deleteEmployeeSchedule(employeeName) {
  try {
    const ss = getOrCreateSpreadsheet();
    const scheduleSheet = ss.getSheetByName('Schedule');
    const data = scheduleSheet.getDataRange().getValues();

    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === employeeName) {
        scheduleSheet.deleteRow(i + 1);
      }
    }

    return { success: true };
  } catch (error) {
    Logger.log('Error deleting employee schedule: ' + error);
    return { success: false, error: error.message };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get spreadsheet URL for admin access
 */
function getSpreadsheetUrl() {
  try {
    const ss = getOrCreateSpreadsheet();
    return ss.getUrl();
  } catch (error) {
    Logger.log('Error getting spreadsheet URL: ' + error);
    return null;
  }
}

/**
 * Initialize default data (for testing)
 */
function initializeDefaultData() {
  const ss = getOrCreateSpreadsheet();

  // Add sample shifts if none exist
  const shiftsSheet = ss.getSheetByName('Shifts');
  if (shiftsSheet.getLastRow() === 1) {
    shiftsSheet.appendRow(['Morning', '06:00', '14:00', new Date()]);
    shiftsSheet.appendRow(['Day', '09:00', '17:00', new Date()]);
    shiftsSheet.appendRow(['Evening', '14:00', '22:00', new Date()]);
    shiftsSheet.appendRow(['Night', '22:00', '06:00', new Date()]);
  }

  return { success: true, url: ss.getUrl() };
}
