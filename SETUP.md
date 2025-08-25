# Robust Scheduler Setup Guide

Follow these steps to set up your automated shift scheduler using Google Sheets and Google Apps Script.

## 1. Create Your Google Sheet

1.  **Create a new Google Sheet.** You can do this by visiting [sheets.new](https://sheets.new).
2.  **Rename the spreadsheet** to something descriptive, like "Shift Scheduler".
3.  **Create three sheets** within the spreadsheet and name them exactly as follows:
    *   `Shifts`
    *   `Employees`
    *   `Config`

## 2. Set Up the Sheet Columns

1.  **In the `Shifts` sheet,** set up the following columns in this order:
    *   `A`: Shift Date
    *   `B`: Start Time
    *   `C`: End Time
    *   `D`: Employee Name
    *   `E`: Role
    *   `F`: Notes
    *   `G`: Calendar Event ID (this will be filled in automatically by the script)

2.  **In the `Employees` sheet,** set up the following columns:
    *   `A`: Employee Name
    *   `B`: Email

3.  **In the `Config` sheet,** set up the following columns:
    *   `A`: Setting
    *   `B`: Value

## 3. Add the Apps Script

1.  **Open the Apps Script editor.** From your spreadsheet, go to `Extensions > Apps Script`.
2.  **Copy the code.** Open the `Code.gs` file from this project, copy the entire content.
3.  **Paste the code** into the `Code.gs` file in the Apps Script editor, replacing any existing content.
4.  **Save the script.** Click the floppy disk icon or press `Ctrl+S` (or `Cmd+S`).

## 4. Configure the Scheduler

1.  **Find your Google Calendar ID:**
    *   Go to your [Google Calendar](https://calendar.google.com).
    *   In the left sidebar, find the calendar you want to use for scheduling.
    *   Hover over the calendar, click the three dots (options), and select `Settings and sharing`.
    *   Scroll down to the `Integrate calendar` section.
    *   Copy the `Calendar ID` (it will look like an email address).

2.  **Add the Calendar ID to your `Config` sheet:**
    *   Go back to your spreadsheet and open the `Config` sheet.
    *   In cell `A1`, type `Setting`.
    *   In cell `B1`, type `Value`.
    *   In cell `A2`, type `Calendar ID`.
    *   In cell `B2`, paste the Calendar ID you copied.

3.  **Add your employees:**
    *   Go to the `Employees` sheet.
    *   Fill in the `Employee Name` and `Email` for each member of your team. **The names must match exactly** with how you will enter them in the `Shifts` sheet.

## 5. Authorize the Script

The first time the script needs to perform an action (like creating a calendar event), it will ask for your permission.

1.  **Manually run a function to trigger authorization:**
    *   Go to the Apps Script editor.
    *   In the toolbar at the top, select the `onOpen` function from the dropdown list.
    *   Click the `Run` button.
2.  **Follow the authorization prompts:**
    *   A dialog box will appear asking for `Authorization required`. Click `Review permissions`.
    *   Choose the Google account you want to authorize the script with.
    *   You will see a warning that `Google hasn't verified this app`. This is normal for your own scripts. Click `Advanced`, then `Go to <Your Script Name> (unsafe)`.
    *   Review the permissions the script is requesting (to manage your calendars and send email) and click `Allow`.

## 6. How to Use the Scheduler

1.  **Add a new shift:**
    *   Go to the `Shifts` sheet.
    *   Fill in the `Shift Date`, `Start Time`, `End Time`, `Employee Name`, and `Role`.
    *   The script will automatically create a Google Calendar event and send an email to the employee. The `Calendar Event ID` will appear in column `G`.
2.  **Update a shift:**
    *   Simply edit the details of the shift in the `Shifts` sheet. The corresponding calendar event will be updated automatically.
3.  **Delete a shift:**
    *   To delete a shift, clear the `Employee Name` for that row. The calendar event will be deleted automatically.
4.  **Manual Sync:**
    *   If anything gets out of sync, you can refresh the whole calendar by going to the `Scheduler` menu in your spreadsheet and clicking `Sync All Shifts to Calendar`.

That's it! Your robust shift scheduler is ready to go.
