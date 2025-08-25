// Robust Scheduler App Script

// --- Global Constants ---
var SHIFTS_SHEET_NAME = 'Shifts';
var EMPLOYEES_SHEET_NAME = 'Employees';
var CONFIG_SHEET_NAME = 'Config';

// Column indices for the Shifts sheet (1-based)
var SHIFT_DATE_COL = 1;
var START_TIME_COL = 2;
var END_TIME_COL = 3;
var EMPLOYEE_NAME_COL = 4;
var ROLE_COL = 5;
var NOTES_COL = 6;
var EVENT_ID_COL = 7;

/**
 * A custom menu to manually trigger scripts.
 */
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('Scheduler')
      .addItem('Sync All Shifts to Calendar', 'syncAllShifts')
      .addToUi();
}

/**
 * The main function that triggers on any edit in the spreadsheet.
 * This function will orchestrate the creation, update, and deletion of calendar events.
 * @param {Object} e The event object from the onEdit trigger.
 */
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;

  // Exit if the edit was not in the 'Shifts' sheet or if it was a multi-cell edit.
  if (sheet.getName() !== SHIFTS_SHEET_NAME || range.getNumRows() > 1 || range.getNumColumns() > 1) {
    return;
  }

  var editedRow = range.getRow();
  // Ignore header row
  if (editedRow === 1) {
    return;
  }

  var shiftData = getShiftData(sheet, editedRow);
  var eventId = shiftData.eventId;

  // Case 1: A shift is cleared/deleted (employee name is removed)
  if (range.getColumn() === EMPLOYEE_NAME_COL && range.getValue() === '') {
    if (eventId) {
      deleteCalendarEvent(eventId);
      sheet.getRange(editedRow, EVENT_ID_COL).clearContent();
    }
    return;
  }

  // Case 2: A new shift is assigned or an existing one is modified
  if (shiftData.date && shiftData.startTime && shiftData.endTime && shiftData.employeeName) {
    if (eventId) {
      // Update existing event
      updateCalendarEvent(eventId, shiftData);
    } else {
      // Create new event
      var newEventId = createCalendarEvent(shiftData);
      if (newEventId) {
        sheet.getRange(editedRow, EVENT_ID_COL).setValue(newEventId);
        sendNewShiftNotification(shiftData);
      }
    }
  }
}

/**
 * Gathers all the data for a given shift from the sheet.
 * @param {Sheet} sheet The sheet object for the 'Shifts' sheet.
 * @param {number} row The row number of the shift.
 * @return {Object} An object containing all the data for the shift.
 */
function getShiftData(sheet, row) {
  var range = sheet.getRange(row, 1, 1, sheet.getLastColumn());
  var values = range.getValues()[0];
  return {
    row: row,
    date: values[SHIFT_DATE_COL - 1],
    startTime: values[START_TIME_COL - 1],
    endTime: values[END_TIME_COL - 1],
    employeeName: values[EMPLOYEE_NAME_COL - 1],
    role: values[ROLE_COL - 1],
    notes: values[NOTES_COL - 1],
    eventId: values[EVENT_ID_COL - 1]
  };
}

// --- Google Calendar Integration ---

/**
 * Creates a Google Calendar event for a shift.
 * @param {Object} shiftData The data for the shift.
 * @return {string} The ID of the created event.
 */
function createCalendarEvent(shiftData) {
  var calendarId = getConfigValue('Calendar ID');
  var calendar = CalendarApp.getCalendarById(calendarId);
  if (!calendar) {
    SpreadsheetApp.getUi().alert('Calendar not found. Check the Calendar ID in the Config sheet.');
    return null;
  }

  var title = shiftData.employeeName + ' - ' + shiftData.role;
  var startTime = new Date(shiftData.date.getTime());
  startTime.setHours(shiftData.startTime.getHours());
  startTime.setMinutes(shiftData.startTime.getMinutes());

  var endTime = new Date(shiftData.date.getTime());
  endTime.setHours(shiftData.endTime.getHours());
  endTime.setMinutes(shiftData.endTime.getMinutes());

  var event = calendar.createEvent(title, startTime, endTime, {
    description: shiftData.notes
  });

  Logger.log('Event created: ' + event.getId());
  return event.getId();
}

/**
 * Updates an existing Google Calendar event.
 * @param {string} eventId The ID of the event to update.
 * @param {Object} shiftData The new data for the shift.
 */
function updateCalendarEvent(eventId, shiftData) {
  var calendarId = getConfigValue('Calendar ID');
  var calendar = CalendarApp.getCalendarById(calendarId);
  var event = calendar.getEventById(eventId);

  if (event) {
    var title = shiftData.employeeName + ' - ' + shiftData.role;
    var startTime = new Date(shiftData.date.getTime());
    startTime.setHours(shiftData.startTime.getHours());
    startTime.setMinutes(shiftData.startTime.getMinutes());

    var endTime = new Date(shiftData.date.getTime());
    endTime.setHours(shiftData.endTime.getHours());
    endTime.setMinutes(shiftData.endTime.getMinutes());

    event.setTitle(title);
    event.setTime(startTime, endTime);
    event.setDescription(shiftData.notes);
    Logger.log('Event updated: ' + eventId);
  }
}

/**
 * Deletes a Google Calendar event.
 * @param {string} eventId The ID of the event to delete.
 */
function deleteCalendarEvent(eventId) {
  var calendarId = getConfigValue('Calendar ID');
  var calendar = CalendarApp.getCalendarById(calendarId);
  var event = calendar.getEventById(eventId);
  if (event) {
    event.deleteEvent();
    Logger.log('Event deleted: ' + eventId);
  }
}

// --- Email Notifications ---

/**
 * Sends a notification for a new shift.
 * @param {Object} shiftData The data for the shift.
 */
function sendNewShiftNotification(shiftData) {
  var employeeEmail = getEmployeeEmail(shiftData.employeeName);
  if (employeeEmail) {
    var subject = 'New Shift Assignment: ' + shiftData.role + ' on ' + Utilities.formatDate(shiftData.date, Session.getScriptTimeZone(), "MM/dd/yyyy");
    var body = 'Hi ' + shiftData.employeeName + ',\n\nYou have been assigned a new shift:\n\n' +
               'Role: ' + shiftData.role + '\n' +
               'Date: ' + Utilities.formatDate(shiftData.date, Session.getScriptTimeZone(), "MM/dd/yyyy") + '\n' +
               'Time: ' + Utilities.formatDate(shiftData.startTime, Session.getScriptTimeZone(), "HH:mm") + ' - ' + Utilities.formatDate(shiftData.endTime, Session.getScriptTimeZone(), "HH:mm") + '\n' +
               'Notes: ' + shiftData.notes + '\n\n' +
               'This has been added to your Google Calendar.';
    MailApp.sendEmail(employeeEmail, subject, body);
  }
}


// --- Helper Functions ---

/**
 * Gets the email address of an employee from the Employees sheet.
 * @param {string} employeeName The name of the employee.
 * @return {string|null} The email address of the employee, or null if not found.
 */
function getEmployeeEmail(employeeName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EMPLOYEES_SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === employeeName) {
      return data[i][1];
    }
  }
  return null;
}

/**
 * Gets a configuration value from the Config sheet.
 * @param {string} settingName The name of the setting.
 * @return {string|null} The value of the setting, or null if not found.
 */
function getConfigValue(settingName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === settingName) {
      return data[i][1];
    }
  }
  return null;
}

/**
 * Manual trigger to sync all shifts in the sheet to the calendar.
 * Useful for initial setup or fixing any discrepancies.
 */
function syncAllShifts() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHIFTS_SHEET_NAME);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) { // Start from 1 to skip header
    var shiftData = getShiftData(sheet, i + 1);

    if (shiftData.date && shiftData.startTime && shiftData.endTime && shiftData.employeeName) {
      if (shiftData.eventId) {
        // Check if event exists, if not, create it.
        try {
          var event = CalendarApp.getEventById(shiftData.eventId);
          if(!event) throw "Event not found";
          updateCalendarEvent(shiftData.eventId, shiftData);
        } catch (e) {
          var newEventId = createCalendarEvent(shiftData);
          sheet.getRange(i + 1, EVENT_ID_COL).setValue(newEventId);
        }
      } else {
        var newEventId = createCalendarEvent(shiftData);
        sheet.getRange(i + 1, EVENT_ID_COL).setValue(newEventId);
      }
    }
  }
  SpreadsheetApp.getUi().alert('All shifts have been synced with the calendar.');
}
