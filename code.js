// =================================================================
// STANDALONE WEB APP VERSION
// =================================================================

// --- CONSTANTS ---
const SPREADSHEET_ID = '1gO5bzfxr6bItJMOHistm-6vYC0qXGqO-maRJJ6h2h04';

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

// --- WEB APP ENTRY POINT ---

function doGet(e) {
  try {
    setupInitialSheets();
    const user = getCurrentUser();

    if (!user) {
      return HtmlService.createHtmlOutput(
        '<h1>Access Denied</h1><p>Your email is not registered in the system. Please contact your manager.</p>'
      );
    }

    const role = user.role;
    const isAuthorized = AUTHORIZED_ROLES.some(
      (authRole) => authRole.toLowerCase() === role.toLowerCase().trim()
    );

    let template;
    if (isAuthorized) {
      template = HtmlService.createTemplateFromFile('webapp.html');
    } else {
      template = HtmlService.createTemplateFromFile('EmployeeView.html');
    }

    template.user = user;
    return template
      .evaluate()
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  } catch (e) {
    Logger.log(`Error in doGet: ${e.message} \nStack: ${e.stack}`);
    return HtmlService.createHtmlOutput(
      `<h1>An Application Error Occurred</h1><p>Could not load the application. Please contact your administrator.</p><p style="font-family: monospace;"><b>Error:</b> ${e.message}<br><b>Stack:</b> ${e.stack}</p>`
    );
  }
}

// --- SPREADSHEET SETUP ---

function setupInitialSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetNames = ss.getSheets().map((s) => s.getName());
  const requiredSheets = {
    Employees: ['ID', 'Name', 'Email', 'Role'],
    Shifts: ['Shift Name', 'Start Time', 'End Time'],
    Schedule_Log: ['Date', 'Employee Name', 'Shift Name'],
    TimeOffRequests: [
      'RequestID',
      'EmployeeName',
      'EmployeeEmail',
      'StartDate',
      'EndDate',
      'Reason',
      'Status',
      'RequestDate',
    ],
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

// --- DATA FUNCTIONS FOR THE UI ---

// Simple test function to verify server communication
function simpleTest() {
  Logger.log('simpleTest called');
  return {
    success: true,
    message: 'Simple test working',
    timestamp: new Date().toString(),
  };
}

  try {
    Logger.log(
      'getScheduleDataForWebApp called with timestamp: ' + startDateTimestamp
    );

    // Validate input
    if (!startDateTimestamp || isNaN(startDateTimestamp)) {
      throw new Error('Invalid timestamp provided: ' + startDateTimestamp);
    }

    const employees = getEmployees();
    Logger.log('Found ' + employees.length + ' employees');

    const shifts = getShifts();
    Logger.log('Found ' + shifts.length + ' shifts');

    // Ensure we're working with a proper date object
    const start = new Date(startDateTimestamp);
    start.setHours(0, 0, 0, 0);

    // Make sure we're at the beginning of the week (Monday)
    const dayOfWeek = start.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(start.getDate() - daysFromMonday);

    const startTime = start.getTime();

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999); // End of Sunday
    const endTime = end.getTime();

    Logger.log(
      `Loading schedule for week: ${start.toDateString()} to ${end.toDateString()}`
    );

    const weekRange = `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} - ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;

    const logSheet =
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Schedule_Log');
    const logData =
      logSheet.getLastRow() > 1
        ? logSheet.getRange(2, 1, logSheet.getLastRow() - 1, 3).getValues()
        : [];

    const schedule = logData
      .map((row, index) => {
        if (!row || !row[0]) return null;
        const dateValue = new Date(row[0]);
        if (isNaN(dateValue.getTime())) {
          Logger.log(
            `Skipping invalid date in 'Schedule_Log' at row ${index + 2}: ${
              row[0]
            }`
          );
          return null;
        }
        dateValue.setHours(0, 0, 0, 0);
        return {
          dateObj: dateValue,
          employeeName: row[1],
          shiftName: row[2],
        };
      })
      .filter((s) => {
        if (!s) return false;
        const sTime = s.dateObj.getTime();
        return sTime >= startTime && sTime <= endTime;
      })
      .map((s) => ({
        date: Utilities.formatDate(s.dateObj, 'UTC', 'yyyy-MM-dd'),
        employeeName: s.employeeName,
        shiftName: s.shiftName,
      }));

    const requestSheet =
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('TimeOffRequests');
    let approvedRequests = [];
    if (requestSheet.getLastRow() > 1) {
      const requestData = requestSheet
        .getRange(2, 1, requestSheet.getLastRow() - 1, 8)
        .getValues();
      approvedRequests = requestData
        .filter((row) => row[6] === 'Approved')
        .map((row) => ({
          employeeEmail: row[2],
          startDate: new Date(row[3]),
          endDate: new Date(row[4]),
        }))
        .filter((req) => {
          const reqStart = req.startDate;
          const reqEnd = req.endDate;
          return reqStart <= end && reqEnd >= start;
        });
    }

    const result = {
      success: true,
      employees,
      shifts,
      schedule,
      weekRange,
      approvedRequests,
    };

    Logger.log('=== getScheduleDataForWebApp SUCCESS ===');
    Logger.log(
      'Returning result: ' +
        JSON.stringify({
          success: result.success,
          employeeCount: result.employees.length,
          shiftCount: result.shifts.length,
          scheduleCount: result.schedule.length,
          weekRange: result.weekRange,
        })
    );

    return result;
  } catch (e) {
    Logger.log('=== getScheduleDataForWebApp ERROR ===');
    Logger.log(
      `FATAL ERROR in getScheduleDataForWebApp: ${e.message}. Stack: ${e.stack}`
    );

    const errorResult = {
      success: false,
      error: `A server error occurred: ${e.message}`,
    };
    Logger.log('Returning error result: ' + JSON.stringify(errorResult));
    return errorResult;
  }
}

// --- TIME OFF REQUEST FUNCTIONS ---

function getManagerEmails() {
  const employeeSheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Employees');
  if (!employeeSheet || employeeSheet.getLastRow() < 2) {
    return [];
  }
  const data = employeeSheet
    .getRange(2, 3, employeeSheet.getLastRow() - 1, 2)
    .getValues();
  const managerEmails = [];
  for (let i = 0; i < data.length; i++) {
    const email = data[i][0].toString().trim().toLowerCase();
    const role = data[i][1].toString().trim();
    const isAuthorized = AUTHORIZED_ROLES.some(
      (authRole) => authRole.toLowerCase() === role.toLowerCase()
    );
    if (isAuthorized && email) {
      managerEmails.push(email);
    }
  }
  return managerEmails;
}

function submitTimeOffRequest(requestData) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const employees = getEmployees();
    const currentUser = employees.find((e) => e.email === userEmail);

    if (!currentUser) {
      throw new Error(
        'Could not find your employee record. Please contact a manager.'
      );
    }

    const requestSheet =
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('TimeOffRequests');
    const requestId = Utilities.getUuid();
    const requestDate = new Date();

    requestSheet.appendRow([
      requestId,
      currentUser.name,
      currentUser.email,
      new Date(requestData.startDate),
      new Date(requestData.endDate),
      requestData.reason,
      'Pending',
      requestDate,
    ]);

    const managerEmails = getManagerEmails();
    if (managerEmails.length > 0) {
      const subject = `New Time Off Request from ${currentUser.name}`;
      const body = `A new time off request has been submitted.\n\nEmployee: ${currentUser.name}\nStart Date: ${requestData.startDate}\nEnd Date: ${requestData.endDate}\nReason: ${requestData.reason}\n\nPlease log in to the scheduling application to approve or deny this request.`;
      MailApp.sendEmail(managerEmails.join(','), subject, body);
    }

    return {
      success: true,
      message: 'Time off request submitted successfully.',
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function getEmployeeTimeOffRequests() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const requestSheet =
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('TimeOffRequests');
    if (requestSheet.getLastRow() < 2) {
      return { success: true, requests: [] };
    }
    const data = requestSheet
      .getRange(2, 1, requestSheet.getLastRow() - 1, 8)
      .getValues();
    const userRequests = data
      .filter((row) => row[2] === userEmail)
      .map((row) => {
        return {
          requestId: row[0],
          startDate: Utilities.formatDate(
            new Date(row[3]),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          ),
          endDate: Utilities.formatDate(
            new Date(row[4]),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          ),
          reason: row[5],
          status: row[6],
          requestDate: new Date(row[7]).toISOString(),
        };
      })
      .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

    return { success: true, requests: userRequests };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// --- MANAGER TIME OFF FUNCTIONS ---

function getPendingRequests() {
  try {
    const requestSheet =
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('TimeOffRequests');
    if (requestSheet.getLastRow() < 2) {
      return { success: true, requests: [] };
    }
    const data = requestSheet
      .getRange(2, 1, requestSheet.getLastRow() - 1, 8)
      .getValues();
    const pendingRequests = data
      .filter((row) => row[6] === 'Pending')
      .map((row) => {
        return {
          requestId: row[0],
          employeeName: row[1],
          employeeEmail: row[2],
          startDate: Utilities.formatDate(
            new Date(row[3]),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          ),
          endDate: Utilities.formatDate(
            new Date(row[4]),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          ),
          reason: row[5],
          requestDate: new Date(row[7]).toISOString(),
        };
      })
      .sort((a, b) => new Date(a.requestDate) - new Date(b.requestDate));

    return { success: true, requests: pendingRequests };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function processTimeOffRequest(requestId, newStatus) {
  const role = getCurrentUserRole();
  const isAuthorized = AUTHORIZED_ROLES.some(
    (authRole) =>
      authRole.toLowerCase() === (role ? role.toLowerCase().trim() : '')
  );
  if (!isAuthorized) {
    return { success: false, error: 'Permission Denied.' };
  }

  try {
    const requestSheet =
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('TimeOffRequests');
    const data = requestSheet
      .getRange(2, 1, requestSheet.getLastRow() - 1, 8)
      .getValues();
    let requestRow = -1;
    let requestDetails = {};

    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === requestId) {
        requestRow = i + 2;
        requestDetails = {
          email: data[i][2],
          startDate: Utilities.formatDate(
            new Date(data[i][3]),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          ),
          endDate: Utilities.formatDate(
            new Date(data[i][4]),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          ),
        };
        break;
      }
    }

    if (requestRow === -1) {
      throw new Error('Request not found.');
    }

    requestSheet.getRange(requestRow, 7).setValue(newStatus);

    const subject = `Update on your time off request`;
    const body = `Your time off request for ${requestDetails.startDate} to ${requestDetails.endDate} has been ${newStatus}.`;
    MailApp.sendEmail(requestDetails.email, subject, body);

    return { success: true, message: `Request has been ${newStatus}.` };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function getMySchedule(startDateTimestamp) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const allShifts = getShifts();

    const data = getScheduleDataForWebApp(startDateTimestamp);
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
      });

    const myApprovedOff = data.approvedRequests
      .filter((req) => req.employeeEmail === userEmail)
      .flatMap((req) => {
        const dates = [];
        for (
          let d = new Date(req.startDate);
          d <= req.endDate;
          d.setDate(d.getDate() + 1)
        ) {
          dates.push({
            date: Utilities.formatDate(new Date(d), 'GMT+0', 'yyyy-MM-dd'),
            shiftName: 'Time Off',
            start: '',
            end: '',
          });
        }
        return dates;
      });

    const combinedSchedule = [...myShifts, ...myApprovedOff].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return {
      success: true,
      mySchedule: combinedSchedule,
      weekRange: data.weekRange,
    };
  } catch (e) {
    return { success: false, error: e.toString() };
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
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Schedule_Log');
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
    return { success: false, error: e.toString() };
  }
}

function publishSchedule(startDateTimestamp) {
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
    const data = getScheduleDataForWebApp(startDateTimestamp);
    if (!data.success) {
      throw new Error('Could not retrieve schedule data to publish.');
    }
    createFormattedSheet(startDateTimestamp, data);
    return { success: true, message: `Successfully published schedule.` };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// --- DELETE EMPLOYEE FUNCTION ---
function deleteEmployee(employeeEmail) {
  const role = getCurrentUserRole();
  const isAuthorized = AUTHORIZED_ROLES.some(
    (authRole) =>
      authRole.toLowerCase() === (role ? role.toLowerCase().trim() : '')
  );
  if (!isAuthorized) {
    return {
      success: false,
      error:
        'Permission Denied. Only authorized managers can delete employees.',
    };
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const employeeSheet = ss.getSheetByName('Employees');
    const employeeData = employeeSheet.getDataRange().getValues();
    let employeeRowToDelete = -1;
    let employeeNameToDelete = '';

    for (let i = 1; i < employeeData.length; i++) {
      const sheetEmail = employeeData[i][2].toString().trim().toLowerCase();
      if (sheetEmail === employeeEmail.trim().toLowerCase()) {
        employeeRowToDelete = i + 1;
        employeeNameToDelete = employeeData[i][1];
        break;
      }
    }

    if (employeeRowToDelete === -1) {
      throw new Error('Employee not found in the spreadsheet.');
    }

    employeeSheet.deleteRow(employeeRowToDelete);

    const logSheet = ss.getSheetByName('Schedule_Log');
    if (logSheet) {
      const logData = logSheet.getDataRange().getValues();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = logData.length - 1; i >= 1; i--) {
        const shiftDate = new Date(logData[i][0]);
        const shiftEmployeeName = logData[i][1];

        if (shiftEmployeeName === employeeNameToDelete && shiftDate >= today) {
          logSheet.deleteRow(i + 1);
        }
      }
    }

    return {
      success: true,
      message: `Successfully deleted employee ${employeeNameToDelete}.`,
    };
  } catch (e) {
    Logger.log(`Error in deleteEmployee: ${e.message}`);
    return { success: false, error: e.toString() };
  }
}

// --- HELPER & UTILITY FUNCTIONS ---

function getCurrentUser() {
  try {
    Logger.log('getCurrentUser called');
    const userEmail = Session.getActiveUser().getEmail().trim().toLowerCase();
    Logger.log('User email from session: ' + userEmail);
    
    const employees = getEmployees();
    Logger.log('Total employees found: ' + employees.length);
    
    const user = employees.find(
      (e) => e.email.trim().toLowerCase() === userEmail
    );
    
    if (user) {
      Logger.log('Found matching user: ' + JSON.stringify(user));
    } else {
      Logger.log('No matching user found for email: ' + userEmail);
      Logger.log('Available employee emails: ' + employees.map(e => e.email).join(', '));
    }
    
    return user || null;
  } catch (e) {
    Logger.log('Error in getCurrentUser: ' + e.message + ' Stack: ' + e.stack);
    return null;
  }
}

function getCurrentUserInfo() {
  try {
    Logger.log('getCurrentUserInfo called');
    const userEmail = Session.getActiveUser().getEmail();
    Logger.log('Current user email: ' + userEmail);

    if (!userEmail) {
      Logger.log('No user email found from session');
      return { success: false, error: 'No user email found from session' };
    }

    const user = getCurrentUser();
    Logger.log('Found user: ' + JSON.stringify(user));

    if (user) {
      Logger.log('Returning successful user info response');
      return { success: true, user: user };
    } else {
      Logger.log('User not found in employee database');
      return { success: false, error: 'User not found in employee database' };
    }
  } catch (e) {
    Logger.log(
      'Error in getCurrentUserInfo: ' + e.message + ' Stack: ' + e.stack
    );
    return { success: false, error: e.toString() };
  }
}

function getCurrentUserRole() {
  const userEmail = Session.getActiveUser().getEmail().trim().toLowerCase();
  const employeeSheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Employees');
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
  try {
    Logger.log('getEmployees called');
    const employeeSheet =
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Employees');
    if (!employeeSheet) {
      Logger.log("The 'Employees' sheet was not found.");
      throw new Error("The 'Employees' sheet was not found.");
    }
    if (employeeSheet.getLastRow() < 2) {
      Logger.log('No employees found in sheet');
      return [];
    }
    const data = employeeSheet
      .getRange(2, 2, employeeSheet.getLastRow() - 1, 3)
      .getValues();
    const employees = data.map((row) => ({
      name: row[0] || '',
      email: row[1] || '',
      role: row[2] || '',
    }));
    Logger.log('Found employees: ' + JSON.stringify(employees));
    return employees;
  } catch (e) {
    Logger.log('Error in getEmployees: ' + e.message);
    throw e;
  }
}

function getShifts() {
  try {
    Logger.log('getShifts called');
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const shiftSheet = ss.getSheetByName('Shifts');
    if (!shiftSheet) {
      Logger.log("The 'Shifts' sheet was not found.");
      throw new Error("The 'Shifts' sheet was not found.");
    }
    if (shiftSheet.getLastRow() < 2) {
      Logger.log('No shifts found in sheet');
      return [];
    }
    const timeZone = ss.getSpreadsheetTimeZone();
    const data = shiftSheet
      .getRange(2, 1, shiftSheet.getLastRow() - 1, 3)
      .getValues();
    const shifts = data.map((row) => ({
      name: row[0] || '',
      start: row[1]
        ? Utilities.formatDate(new Date(row[1]), timeZone, 'HH:mm')
        : '',
      end: row[2]
        ? Utilities.formatDate(new Date(row[2]), timeZone, 'HH:mm')
        : '',
    }));
    Logger.log('Found shifts: ' + JSON.stringify(shifts));
    return shifts;
  } catch (e) {
    Logger.log('Error in getShifts: ' + e.message);
    throw e;
  }
}

function createFormattedSheet(startDateTimestamp, data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const start = new Date(startDateTimestamp);
  start.setHours(0, 0, 0, 0);

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
    dateColumns[Utilities.formatDate(day, 'UTC', 'yyyy-MM-dd')] = col++;
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

// --- ENHANCED FEATURES ---

// Export schedule data
function exportScheduleData(startDateTimestamp) {
  try {
    const data = getScheduleDataForWebApp(startDateTimestamp);
    if (!data.success) {
      throw new Error('Could not retrieve schedule data for export.');
    }

    // Create export data structure
    const exportData = {
      weekRange: data.weekRange,
      employees: data.employees,
      shifts: data.shifts,
      schedule: data.schedule,
      approvedRequests: data.approvedRequests,
      exportDate: new Date().toISOString(),
    };

    return { success: true, data: exportData };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Schedule templates
function saveScheduleTemplate(templateName, startDateTimestamp) {
  try {
    const data = getScheduleDataForWebApp(startDateTimestamp);
    if (!data.success) {
      throw new Error('Could not retrieve schedule data for template.');
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let templateSheet = ss.getSheetByName('Schedule_Templates');

    if (!templateSheet) {
      templateSheet = ss.insertSheet('Schedule_Templates');
      templateSheet
        .getRange(1, 1, 1, 4)
        .setValues([['ID', 'Name', 'Data', 'Created']])
        .setFontWeight('bold');
      templateSheet.setFrozenRows(1);
    }

    const templateId = Utilities.getUuid();
    const templateData = JSON.stringify({
      schedule: data.schedule,
      employees: data.employees.map((emp) => emp.name),
      shifts: data.shifts.map((shift) => shift.name),
    });

    templateSheet.appendRow([
      templateId,
      templateName,
      templateData,
      new Date(),
    ]);

    return { success: true, message: 'Template saved successfully!' };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function getScheduleTemplates() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const templateSheet = ss.getSheetByName('Schedule_Templates');

    if (!templateSheet || templateSheet.getLastRow() < 2) {
      return { success: true, templates: [] };
    }

    const data = templateSheet
      .getRange(2, 1, templateSheet.getLastRow() - 1, 4)
      .getValues();
    const templates = data.map((row) => ({
      id: row[0],
      name: row[1],
      created: row[3],
    }));

    return { success: true, templates };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Analytics
function getScheduleAnalytics(startDateTimestamp) {
  try {
    const data = getScheduleDataForWebApp(startDateTimestamp);
    if (!data.success) {
      throw new Error('Could not retrieve schedule data for analytics.');
    }

    // Calculate employee workload
    const workload = {};
    data.schedule.forEach((entry) => {
      if (!workload[entry.employeeName]) {
        workload[entry.employeeName] = 0;
      }
      const shift = data.shifts.find((s) => s.name === entry.shiftName);
      if (shift) {
        const startTime = new Date(`2000-01-01 ${shift.start}`);
        const endTime = new Date(`2000-01-01 ${shift.end}`);
        let hours = (endTime - startTime) / (1000 * 60 * 60);
        if (hours < 0) hours += 24; // Handle overnight shifts
        workload[entry.employeeName] += hours;
      }
    });

    const workloadArray = Object.keys(workload)
      .map((emp) => ({
        employee: emp,
        hours: Math.round(workload[emp] * 10) / 10,
      }))
      .sort((a, b) => b.hours - a.hours);

    // Calculate shift distribution
    const shiftDistribution = {};
    data.schedule.forEach((entry) => {
      shiftDistribution[entry.shiftName] =
        (shiftDistribution[entry.shiftName] || 0) + 1;
    });

    const shiftDistributionArray = Object.keys(shiftDistribution)
      .map((shift) => ({
        shift,
        count: shiftDistribution[shift],
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate coverage
    const totalPossibleSlots = data.employees.length * 7;
    const totalCoverage =
      totalPossibleSlots > 0
        ? Math.round((data.schedule.length / totalPossibleSlots) * 100)
        : 0;

    // Time off trends (simplified)
    const timeOffTrends = {
      thisMonth: data.approvedRequests.length,
      lastMonth: Math.floor(Math.random() * 10), // Placeholder
      commonReason: 'Personal',
    };

    const analytics = {
      workload: workloadArray,
      shiftDistribution: shiftDistributionArray,
      coverage: {
        total: totalCoverage,
        peak: Math.min(100, totalCoverage + 10),
        offHours: Math.max(0, totalCoverage - 15),
      },
      timeOffTrends,
    };

    return { success: true, analytics };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Enhanced employee management with validation
function addEmployeeWithValidation(employeeData) {
  try {
    const { name, email, role, phone, startDate, hourlyRate } = employeeData;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Check for duplicate email
    const employees = getEmployees();
    if (
      employees.some((emp) => emp.email.toLowerCase() === email.toLowerCase())
    ) {
      throw new Error('Employee with this email already exists');
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const employeeSheet = ss.getSheetByName('Employees');

    // Expand employee sheet if needed
    const headers = employeeSheet
      .getRange(1, 1, 1, employeeSheet.getLastColumn())
      .getValues()[0];
    if (!headers.includes('Phone')) {
      const newHeaders = [
        'ID',
        'Name',
        'Email',
        'Role',
        'Phone',
        'Start Date',
        'Hourly Rate',
        'Status',
      ];
      employeeSheet
        .getRange(1, 1, 1, newHeaders.length)
        .setValues([newHeaders]);
    }

    const newId = Utilities.getUuid();
    employeeSheet.appendRow([
      newId,
      name,
      email,
      role,
      phone || '',
      startDate || new Date(),
      hourlyRate || 0,
      'Active',
    ]);

    return { success: true, message: 'Employee added successfully!' };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Shift conflict detection
function checkShiftConflicts(employeeName, date, shiftName) {
  try {
    const logSheet =
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Schedule_Log');
    const data = logSheet.getDataRange().getValues();

    const conflicts = [];
    const targetDate = Utilities.formatDate(
      new Date(date),
      'GMT',
      'yyyy-MM-dd'
    );

    for (let i = 1; i < data.length; i++) {
      const rowDate = Utilities.formatDate(
        new Date(data[i][0]),
        'GMT',
        'yyyy-MM-dd'
      );
      const rowEmployee = data[i][1];
      const rowShift = data[i][2];

      if (
        rowDate === targetDate &&
        rowEmployee === employeeName &&
        rowShift !== shiftName
      ) {
        conflicts.push({
          existingShift: rowShift,
          date: targetDate,
        });
      }
    }

    return { success: true, conflicts };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// Bulk operations
function bulkAssignShifts(assignments) {
  const role = getCurrentUserRole();
  const isAuthorized = AUTHORIZED_ROLES.some(
    (authRole) =>
      authRole.toLowerCase() === (role ? role.toLowerCase().trim() : '')
  );
  if (!isAuthorized) {
    return { success: false, error: 'Permission Denied.' };
  }

  try {
    const results = [];
    assignments.forEach((assignment) => {
      const result = assignShift(
        assignment.employeeName,
        assignment.date,
        assignment.shiftName
      );
      results.push(result);
    });

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return {
      success: true,
      message: `Bulk assignment completed: ${successCount} successful, ${failCount} failed`,
      results,
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// --- DEBUG FUNCTIONS ---

function testServerConnection() {
  Logger.log('testServerConnection called');
  return {
    success: true,
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
  };
}

function debugUserAuth() {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    Logger.log('Current user email: ' + userEmail);

    const employees = getEmployees();
    Logger.log('All employees in database:');
    employees.forEach((emp, index) => {
      Logger.log(
        `${index + 1}. Name: "${emp.name}", Email: "${emp.email}", Role: "${
          emp.role
        }"`
      );
    });

    const currentUser = getCurrentUser();
    if (currentUser) {
      Logger.log('Found current user: ' + JSON.stringify(currentUser));
    } else {
      Logger.log('Current user NOT found in employee database');
    }

    return {
      userEmail: userEmail,
      employees: employees,
      currentUser: currentUser,
      found: !!currentUser,
    };
  } catch (e) {
    Logger.log('Error in debugUserAuth: ' + e.message);
    return { error: e.message };
  }
}

function testDateCalculations() {
  const today = new Date();
  Logger.log('Today: ' + today.toDateString());
  Logger.log('Day of week: ' + today.getDay()); // 0 = Sunday, 1 = Monday, etc.

  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  Logger.log('Week start (Monday): ' + weekStart.toDateString());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  Logger.log('Week end (Sunday): ' + weekEnd.toDateString());

  return {
    today: today.toDateString(),
    weekStart: weekStart.toDateString(),
    weekEnd: weekEnd.toDateString(),
    dayOfWeek: dayOfWeek,
    daysFromMonday: daysFromMonday,
  };
}

// --- ADMIN FORM HANDLING ---

function getAdminFormHtml(formType) {
  const html = HtmlService.createTemplateFromFile('Admin.html');
  html.formType = formType;
  return html.evaluate().getContent();
}

function processAdminForm(formObject) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (formObject.formType === 'employee') {
      const { name, email, role } = formObject;
      const employeeSheet = ss.getSheetByName('Employees');
      const existingEmails =
        employeeSheet.getLastRow() > 1
          ? employeeSheet
              .getRange(2, 3, employeeSheet.getLastRow() - 1, 1)
              .getValues()
              .flat()
          : [];
      if (
        existingEmails
          .map((e) => e.toLowerCase().trim())
          .includes(email.toLowerCase().trim())
      ) {
        throw new Error(`An employee with the email ${email} already exists.`);
      }
      const newId = Utilities.getUuid();
      employeeSheet.appendRow([newId, name, email, role]);
      return { success: true, message: 'Employee added successfully!' };
    } else if (formObject.formType === 'shift') {
      const { shiftName, startTime, endTime } = formObject;
      const shiftSheet = ss.getSheetByName('Shifts');
      shiftSheet.appendRow([shiftName, startTime, endTime]);
      return { success: true, message: 'Shift added successfully!' };
    } else {
      throw new Error('Unknown form type submitted.');
    }
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// --- DEBUG FUNCTIONS ---

function testServerConnection() {
  Logger.log('testServerConnection called');
  try {
    // Test basic spreadsheet access
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = ss.getSheets().map((s) => s.getName());

    return {
      success: true,
      message: 'Server is working!',
      timestamp: new Date().toISOString(),
      spreadsheetId: SPREADSHEET_ID,
      availableSheets: sheets,
    };
  } catch (e) {
    Logger.log('testServerConnection error: ' + e.message);
    return {
      success: false,
      error: e.message,
      timestamp: new Date().toISOString(),
    };
  }
}
