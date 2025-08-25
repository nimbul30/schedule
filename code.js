// =================================================================
// STANDALONE WEB APP VERSION
// =================================================================

// --- CONSTANTS ---
// IMPORTANT: Replace this with the ID of your Google Sheet.
// The ID is the long string of characters in the URL of your sheet.
// e.g., for "https://docs.google.com/spreadsheets/d/12345abcdefg...", the ID is "12345abcdefg..."
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

/**
 * This is the main function that runs when the web app URL is accessed.
 * It determines the user's role and serves the appropriate HTML page.
 */
function doGet(e) {
  try {
    // It's good practice to run this setup function to ensure sheets exist.
    // It only creates them if they are missing.
    setupInitialSheets();

    const user = getCurrentUser();
    const role = user ? user.role : '';
    const isAuthorized = AUTHORIZED_ROLES.some(
      (authRole) => authRole.toLowerCase() === role.toLowerCase().trim()
    );

    let template;
    if (isAuthorized) {
      template = HtmlService.createTemplateFromFile('webapp.html');
    } else {
      template = HtmlService.createTemplateFromFile('EmployeeView.html');
    }

    // Pass the user object to the template
    template.user = user;

    return template
      .evaluate()
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  } catch (e) {
    Logger.log('Error in doGet: ' + e.message);
    return HtmlService.createHtmlOutput(
      `<h1>An error occurred</h1><p>${e.message}</p><p>Please ensure you have correctly set the SPREADSHEET_ID in the script.</p>`
    );
  }
}

// --- SPREADSHEET SETUP ---

/**
 * Checks for and creates required sheets if they don't exist in the specified spreadsheet.
 */
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
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Schedule_Log');
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

    // Fetch approved time off requests
    const requestSheet =
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('TimeOffRequests');
    let approvedRequests = [];
    if (requestSheet.getLastRow() > 1) {
      const requestData = requestSheet
        .getRange(2, 1, requestSheet.getLastRow() - 1, 8)
        .getValues();
      approvedRequests = requestData
        .filter((row) => row[6] === 'Approved') // Only approved
        .map((row) => ({
          employeeEmail: row[2],
          startDate: new Date(row[3]),
          endDate: new Date(row[4]),
        }))
        .filter((req) => {
          // Check for date overlap
          const reqStart = req.startDate;
          const reqEnd = req.endDate;
          return reqStart <= end && reqEnd >= start;
        });
    }

    return {
      success: true,
      employees,
      shifts,
      schedule,
      weekRange,
      approvedRequests,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// --- TIME OFF REQUEST FUNCTIONS ---

/**
 * Gets a list of all manager email addresses for notifications.
 */
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

/**
 * Called by an employee to submit a new time-off request.
 */
function submitTimeOffRequest(requestData) {
  // Enhanced logging
  Logger.log(
    'submitTimeOffRequest started for request: ' + JSON.stringify(requestData)
  );
  try {
    const userEmail = Session.getActiveUser().getEmail();
    Logger.log('User email: ' + userEmail);

    const employees = getEmployees();
    const currentUser = employees.find((e) => e.email === userEmail);

    if (!currentUser) {
      throw new Error(
        'Could not find your employee record. Please contact a manager.'
      );
    }
    Logger.log('Current user found: ' + currentUser.name);

    const requestSheet =
      SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('TimeOffRequests');
    const requestId = Utilities.getUuid();
    const requestDate = new Date();

    // Section for appending row to spreadsheet
    try {
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
      Logger.log('Time off request appended to spreadsheet successfully.');
    } catch (e) {
      Logger.log('Error appending to spreadsheet: ' + e.message);
      throw new Error(
        'Failed to log the request in the spreadsheet. ' + e.message
      );
    }

    // Section for sending email
    try {
      const managerEmails = getManagerEmails();
      if (managerEmails.length > 0) {
        const subject = `New Time Off Request from ${currentUser.name}`;
        const body = `A new time off request has been submitted.\n\nEmployee: ${currentUser.name}\nStart Date: ${requestData.startDate}\nEnd Date: ${requestData.endDate}\nReason: ${requestData.reason}\n\nPlease log in to the scheduling application to approve or deny this request.`;
        MailApp.sendEmail(managerEmails.join(','), subject, body);
        Logger.log('Email notification sent to: ' + managerEmails.join(','));
      } else {
        Logger.log('No manager emails found to send notification.');
      }
    } catch (e) {
      Logger.log('Error sending email: ' + e.message);
      // Still return success if email fails, as the request was logged.
      // But include a specific error message about the email failure.
      return {
        success: true,
        message:
          'Request submitted, but failed to send manager notification. Please contact your manager directly to inform them.',
      };
    }

    return {
      success: true,
      message: 'Time off request submitted successfully.',
    };
  } catch (e) {
    Logger.log('Error in submitTimeOffRequest: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Gets all time-off requests submitted by the current user.
 */
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
          status: row[6],
          requestDate: Utilities.formatDate(
            new Date(row[7]),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          ),
        };
      })
      .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate)); // Sort by most recent first

    return { success: true, requests: userRequests };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// --- MANAGER TIME OFF FUNCTIONS ---

/**
 * Gets all pending time off requests for managers to review.
 */
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
          status: row[6],
          requestDate: Utilities.formatDate(
            new Date(row[7]),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          ),
        };
      })
      .sort((a, b) => new Date(a.requestDate) - new Date(b.requestDate)); // Sort by oldest first

    return { success: true, requests: pendingRequests };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Processes a time off request (approve or deny)
 */
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
        requestRow = i + 2; // +2 to account for 0-based index and header row
        requestDetails = {
          name: data[i][1],
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
      throw new Error(
        'Request not found. It may have been processed by another manager.'
      );
    }

    // Update status in the sheet
    requestSheet.getRange(requestRow, 7).setValue(newStatus); // Column G for Status

    // Send confirmation email to employee
    const subject = `Update on your time off request`;
    const body = `Your time off request for ${requestDetails.startDate} to ${requestDetails.endDate} has been ${newStatus}.`;
    MailApp.sendEmail(requestDetails.email, subject, body);

    return { success: true, message: `Request has been ${newStatus}.` };
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
      });

    // Filter approved requests for the current user and add them to the schedule
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

// --- HELPER & UTILITY FUNCTIONS ---

function getCurrentUser() {
  try {
    const userEmail = Session.getActiveUser().getEmail().trim().toLowerCase();
    const employees = getEmployees(); // This already returns name, email, role
    const user = employees.find(
      (e) => e.email.trim().toLowerCase() === userEmail
    );
    return user || null; // Return the full user object or null
  } catch (e) {
    Logger.log('Error in getCurrentUser: ' + e.message);
    return null;
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
  const employeeSheet =
    SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Employees');
  if (!employeeSheet) throw new Error("The 'Employees' sheet was not found.");
  if (employeeSheet.getLastRow() < 2) return [];
  return employeeSheet
    .getRange(2, 2, employeeSheet.getLastRow() - 1, 3)
    .getValues()
    .map((row) => ({ name: row[0], email: row[1], role: row[2] }));
}

function getShifts() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const shiftSheet = ss.getSheetByName('Shifts');
  if (!shiftSheet) throw new Error("The 'Shifts' sheet was not found.");
  if (shiftSheet.getLastRow() < 2) return [];
  const timeZone = ss.getSpreadsheetTimeZone();
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
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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

// --- ADMIN FORM HANDLING ---

/**
 * Returns the HTML for either the 'Add Employee' or 'Add Shift' form.
 * This is called by the client-side JavaScript to populate a modal dialog.
 */
function getAdminFormHtml(formType) {
  const html = HtmlService.createTemplateFromFile('Admin.html');
  html.formType = formType;
  return html.evaluate().getContent();
}

/**
 * Processes the data submitted from the admin forms.
 */
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
      if (existingEmails.includes(email)) {
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
    return { success: false, error: e.message };
  }
}
