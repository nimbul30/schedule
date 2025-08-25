// =================================================================
// SPREADSHEET-INTEGRATED VERSION
// =================================================================

// --- CONSTANTS ---
// This list is now checked in a case-insensitive way.
const AUTHORIZED_ROLES = ['Manager', 'Assistant Manager'];
const ROLE_COLORS = {
  Manager: '#aed6f1',
  Supervisor: '#f1948a',
  Trainee: '#a9dfbf',
  'Assistant Manager': '#f7dc6f',
  'Sales Associate': ' #d7bde2',
  Cashier: '#f5b041',
  default: '#eeeeee',
};

// --- SPREADSHEET SETUP & MENU ---

/**
 * Creates the custom menu in the spreadsheet when it's opened.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Scheduler')
    .addItem('Open Scheduler', 'openSchedulerUI')
    .addSeparator()
    .addItem('Add New Employee', 'showAddEmployeeDialog')
    .addItem('Add New Shift Type', 'showAddShiftDialog')
    .addToUi();
  setupInitialSheets();
}

/**
 * Checks for and creates required sheets if they don't exist.
 */
function setupInitialSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetNames = ss.getSheets().map((s) => s.getName());
  const requiredSheets = {
    Employees: ['ID', 'Name', 'Email', 'Role'],
    Shifts: ['Shift Name', 'Start Time', 'End Time'],
    Schedule_Log: ['Date', 'Employee Name', 'Shift Name'],
  };
  for (const sheetName in requiredSheets) {
    if (!sheetNames.includes(sheetName)) {
      const sheet = ss.insertSheet(sheetName);
      sheet
        .getRange(1, 1, 1, requiredSheets[sheetName].length)
        .setValues([requiredSheets[sheetName]])
        .setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
}

// --- SPREADSHEET UI LAUNCHER ---

/**
 * Opens the appropriate UI in a large modal dialog (popup).
 * The dimensions have been increased to be as large as practically possible.
 */
function openSchedulerUI() {
  try {
    const role = getCurrentUserRole();
    const isAuthorized = AUTHORIZED_ROLES.some(
      (authRole) =>
        authRole.toLowerCase() === (role ? role.toLowerCase().trim() : '')
    );
    let htmlOutput;
    let title;
    if (isAuthorized) {
      title = 'Scheduling Dashboard';
      htmlOutput = HtmlService.createHtmlOutputFromFile('WebApp.html')
        .setWidth(1800) // CHANGED: Increased width to fill larger screens
        .setHeight(1000); // CHANGED: Increased height
    } else {
      title = 'My Schedule';
      htmlOutput = HtmlService.createHtmlOutputFromFile('EmployeeView.html')
        .setWidth(800) // CHANGED: Increased width
        .setHeight(600); // CHANGED: Increased height
    }
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, title);
  } catch (e) {
    Logger.log('Error in openSchedulerUI: ' + e.message);
    SpreadsheetApp.getUi().alert(
      'An error occurred while trying to open the scheduler. Please contact your administrator.'
    );
  }
}

// --- DATA FUNCTIONS FOR THE UI (Unchanged) ---

function getScheduleDataForWebApp(startDateString) {
  try {
    const employees = getEmployees();
    const shifts = getShifts();
    const start = new Date(startDateString + 'T00:00:00');
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const weekRange = `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} - ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
    const logSheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Schedule_Log');
    const logData =
      logSheet.getLastRow() > 1
        ? logSheet.getRange(2, 1, logSheet.getLastRow() - 1, 3).getValues()
        : [];
    const schedule = logData
      .map((row) => ({
        date: Utilities.formatDate(new Date(row[0]), 'GMT+0', 'yyyy-MM-dd'),
        employeeName: row[1],
        shiftName: row[2],
      }))
      .filter((s) => {
        const sDate = new Date(s.date + 'T00:00:00');
        return sDate >= start && sDate <= end;
      });
    return { success: true, employees, shifts, schedule, weekRange };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getMySchedule(startDateString) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const allShifts = getShifts();
    const data = getScheduleDataForWebApp(startDateString);
    if (!data.success) {
      throw new Error(data.error);
    }
    const myShifts = data.schedule
      .map((entry) => {
        const employee = data.employees.find(
          (e) => e.name === entry.employeeName
        );
        return { ...entry, email: employee ? employee.email : null };
      })
      .filter((entry) => entry.email === userEmail)
      .map((entry) => {
        const shiftInfo = allShifts.find((s) => s.name === entry.shiftName);
        return { ...entry, start: shiftInfo.start, end: shiftInfo.end };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return { success: true, myShifts, weekRange: data.weekRange };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function assignShift(employeeName, date, shiftName) {
  const role = getCurrentUserRole();
  const isAuthorized = AUTHORIZED_ROLES.some(
    (authRole) =>
      authRole.toLowerCase() === (role ? role.toLowerCase().trim() : '')
  );
  if (!isAuthorized) {
    return {
      success: false,
      error: 'Permission Denied. Only authorized managers can edit schedules.',
    };
  }
  try {
    const logSheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Schedule_Log');
    const data = logSheet.getDataRange().getValues();
    const formattedDate = Utilities.formatDate(
      new Date(date),
      'GMT',
      'yyyy-MM-dd'
    );
    for (let i = data.length - 1; i >= 1; i--) {
      const rowDate = Utilities.formatDate(
        new Date(data[i][0]),
        'GMT',
        'yyyy-MM-dd'
      );
      const rowName = data[i][1];
      if (rowDate === formattedDate && rowName === employeeName) {
        logSheet.deleteRow(i + 1);
      }
    }
    if (shiftName && shiftName !== '') {
      logSheet.appendRow([formattedDate, employeeName, shiftName]);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function publishSchedule(startDateString) {
  const role = getCurrentUserRole();
  const isAuthorized = AUTHORIZED_ROLES.some(
    (authRole) =>
      authRole.toLowerCase() === (role ? role.toLowerCase().trim() : '')
  );
  if (!isAuthorized) {
    return {
      success: false,
      error:
        'Permission Denied. Only authorized managers can publish schedules.',
    };
  }
  try {
    const data = getScheduleDataForWebApp(startDateString);
    if (!data.success) {
      throw new Error('Could not retrieve schedule data to publish.');
    }
    createFormattedSheet(startDateString, data);
    return { success: true, message: `Successfully published schedule.` };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// --- HELPER & UTILITY FUNCTIONS (Unchanged) ---

function getCurrentUserRole() {
  const userEmail = Session.getActiveUser().getEmail().trim().toLowerCase();
  const employeeSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Employees');
  if (!employeeSheet) return null;
  const data = employeeSheet
    .getRange(2, 3, employeeSheet.getLastRow() - 1, 2)
    .getValues();
  for (let i = 0; i < data.length; i++) {
    const sheetEmail = data[i][0].toString().trim().toLowerCase();
    if (sheetEmail === userEmail) {
      return data[i][1].toString().trim();
    }
  }
  return null;
}

function getEmployees() {
  const employeeSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Employees');
  if (!employeeSheet) throw new Error("The 'Employees' sheet was not found.");
  if (employeeSheet.getLastRow() < 2) return [];
  return employeeSheet
    .getRange(2, 2, employeeSheet.getLastRow() - 1, 3)
    .getValues()
    .map((row) => ({ name: row[0], email: row[1], role: row[2] }));
}

function getShifts() {
  const shiftSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Shifts');
  if (!shiftSheet) throw new Error("The 'Shifts' sheet was not found.");
  if (shiftSheet.getLastRow() < 2) return [];
  const timeZone = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  return shiftSheet
    .getRange(2, 1, shiftSheet.getLastRow() - 1, 3)
    .getValues()
    .map((row) => ({
      name: row[0],
      start: Utilities.formatDate(new Date(row[1]), timeZone, 'HH:mm'),
      end: Utilities.formatDate(new Date(row[2]), timeZone, 'HH:mm'),
    }));
}

function createFormattedSheet(startDateString, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const start = new Date(startDateString);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const sheetName = `Schedule ${Utilities.formatDate(
    start,
    'GMT',
    'MM-dd'
  )} to ${Utilities.formatDate(end, 'GMT', 'MM-dd')}`;
  let scheduleSheet = ss.getSheetByName(sheetName);
  if (scheduleSheet) {
    scheduleSheet.clear();
  } else {
    scheduleSheet = ss.insertSheet(sheetName, 0);
  }
  ss.setActiveSheet(scheduleSheet);
  const headers = ['Staff'];
  const dateColumns = {};
  let col = 2;
  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    headers.push(Utilities.formatDate(day, 'GMT', 'EEE, MMM d'));
    dateColumns[Utilities.formatDate(day, 'GMT', 'yyyy-MM-dd')] = col++;
  }
  scheduleSheet
    .getRange(2, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  scheduleSheet.getRange(2, 1).setHorizontalAlignment('left');
  scheduleSheet.setFrozenRows(2);
  scheduleSheet.setFrozenColumns(1);
  const employeeRowMap = {};
  let currentRow = 3;
  for (const employee of data.employees) {
    scheduleSheet
      .getRange(currentRow, 1)
      .setValue(employee.name)
      .setFontWeight('bold');
    scheduleSheet
      .getRange(currentRow + 1, 1)
      .setValue(employee.role)
      .setFontSize(9)
      .setFontColor('#666666');
    employeeRowMap[employee.name] = currentRow;
    currentRow += 2;
  }
  const timeZone = ss.getSpreadsheetTimeZone();
  for (const entry of data.schedule) {
    const row = employeeRowMap[entry.employeeName];
    const shiftInfo = data.shifts.find((s) => s.name === entry.shiftName);
    const col = dateColumns[entry.date];
    if (row && col && shiftInfo) {
      const [startH, startM] = shiftInfo.start.split(':');
      const [endH, endM] = shiftInfo.end.split(':');
      const tempStartDate = new Date();
      tempStartDate.setHours(startH, startM);
      const tempEndDate = new Date();
      tempEndDate.setHours(endH, endM);
      const startTime = Utilities.formatDate(tempStartDate, timeZone, 'h:mm a');
      const endTime = Utilities.formatDate(tempEndDate, timeZone, 'h:mm a');
      const timeText = `${startTime} - ${endTime}`;
      const employeeInfo = data.employees.find(
        (e) => e.name === entry.employeeName
      );
      const role = employeeInfo ? employeeInfo.role : '';
      const cell = scheduleSheet.getRange(row, col);
      cell.setValue(timeText);
      cell.offset(1, 0).setValue(role);
      const color = ROLE_COLORS[role] || ROLE_COLORS['default'];
      scheduleSheet.getRange(row, col, 2, 1).setBackground(color);
    }
  }
  const lastRow = scheduleSheet.getLastRow();
  const lastCol = scheduleSheet.getLastColumn();
  scheduleSheet
    .getRange(3, 2, lastRow - 2, lastCol - 1)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setFontSize(9);
  scheduleSheet
    .getRange(3, 1, lastRow - 2, lastCol)
    .setBorder(
      true,
      true,
      true,
      true,
      true,
      true,
      '#cccccc',
      SpreadsheetApp.BorderStyle.SOLID
    );
  scheduleSheet.setColumnWidth(1, 150);
  if (lastCol > 1) {
    scheduleSheet.setColumnWidths(2, lastCol - 1, 120);
  }
}

// --- ADMIN DIALOGS & DATA PROCESSING ---

function showAddEmployeeDialog() {
  const html = HtmlService.createTemplateFromFile('Admin.html');
  html.formType = 'employee'; // CHANGED: Increased the size of the admin dialog
  SpreadsheetApp.getUi().showModalDialog(
    html.evaluate().setWidth(500).setHeight(450),
    'Add New Employee'
  );
}

function showAddShiftDialog() {
  const html = HtmlService.createTemplateFromFile('Admin.html');
  html.formType = 'shift'; // CHANGED: Increased the size of the admin dialog
  SpreadsheetApp.getUi().showModalDialog(
    html.evaluate().setWidth(500).setHeight(450),
    'Add New Shift Type'
  );
}

function processAdminForm(formObject) {
  try {
    if (formObject.formType === 'employee') {
      const { name, email, role } = formObject;
      const employeeSheet =
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Employees');
      const existingEmails =
        employeeSheet.getLastRow() > 1
          ? employeeSheet
              .getRange(2, 3, employeeSheet.getLastRow() - 1, 1)
              .getValues()
              .flat()
          : [];
      if (existingEmails.includes(email)) {
        throw new Error(`An employee with the email ${email} already exists.`);
      }
      const newId = Utilities.getUuid();
      employeeSheet.appendRow([newId, name, email, role]);
      SpreadsheetApp.getUi().alert('Employee added successfully!');
    } else if (formObject.formType === 'shift') {
      const { shiftName, startTime, endTime } = formObject;
      const shiftSheet =
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Shifts');
      shiftSheet.appendRow([shiftName, startTime, endTime]);
      SpreadsheetApp.getUi().alert('Shift added successfully!');
    } else {
      throw new Error('Unknown form type submitted.');
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert(`Error: ${e.message}`);
  }
}
