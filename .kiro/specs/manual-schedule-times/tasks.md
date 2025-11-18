# Implementation Plan

- [x] 1. Add Time Entry Modal HTML structure to webapp.html

  - Add the complete modal HTML after the existing modals (after settings-modal)
  - Include all sections: mode selector, predefined shift selector, custom time inputs, duration display, and action buttons
  - Add proper Tailwind CSS classes for styling consistency
  - _Requirements: 1.1, 1.2, 3.1_

- [x] 2. Add CSS styles for shift cells and modal

  - Add shift cell styles (.shift-cell-empty, .shift-cell-custom, .shift-cell-predefined) to the <style> section
  - Add hover effects and transitions for better UX
  - Add time entry modal specific styles
  - Ensure visual distinction between custom and predefined shifts
  - _Requirements: 1.5, 3.2_

- [x] 3. Implement core modal management functions

  - [x] 3.1 Create currentModalContext global variable to track modal state

    - Initialize with employeeName, date, and existingAssignment properties
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 Implement openTimeEntryModal() function

    - Accept employeeName, date, and assignment parameters
    - Populate modal header with employee name and formatted date
    - Populate shift selector dropdown with available shifts
    - Handle editing existing assignments (both custom and predefined)
    - Set appropriate mode (predefined vs custom) based on assignment type
    - Show the modal
    - _Requirements: 1.1, 1.2, 3.1, 3.2_

  - [x] 3.3 Implement closeTimeEntryModal() function

    - Hide the modal
    - Reset currentModalContext
    - _Requirements: 1.1, 1.2_

  - [x] 3.4 Implement toggleShiftMode() function

    - Accept mode parameter ('predefined' or 'custom')
    - Show/hide appropriate sections based on mode
    - Trigger preview/calculation updates
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Implement time calculation functions

  - [x] 4.1 Update calculateShiftHours() function to handle overnight shifts

    - Add isOvernight parameter (default false)
    - Calculate hours correctly for overnight shifts (add 24 hours when negative)
    - Return rounded hours to 2 decimal places
    - _Requirements: 2.1, 2.2, 5.1, 5.2_

  - [x] 4.2 Implement calculateCustomDuration() function

    - Read values from custom time inputs and overnight checkbox
    - Call calculateShiftHours() with appropriate parameters
    - Update duration display and time range display
    - Handle empty inputs gracefully
    - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3_

  - [x] 4.3 Implement updateTimePreview() function

    - Read selected shift from dropdown
    - Find shift details from allShifts array
    - Calculate and display duration
    - Display time range
    - _Requirements: 2.1, 3.2_

- [x] 5. Implement data persistence functions

  - [x] 5.1 Implement saveShiftAssignment() function

    - Determine mode (predefined or custom)

    - Validate inputs based on mode
    - Create assignment object with appropriate fields (isCustom, isOvernight)
    - Validate time order for non-overnight custom shifts
    - Remove existing assignment for same employee/date
    - Add new assignment to schedule array
    - Save to localStorage
    - Close modal and refresh schedule display
    - Show success notification
    - _Requirements: 1.3, 1.4, 1.5, 2.3, 3.3, 3.4, 5.1_

  - [x] 5.2 Implement clearShift() function

    - Show confirmation dialog
    - Remove assignment from schedule array
    - Save updated schedule to localStorage
    - Update hours calculator
    - Close modal and refresh display
    - Show notification
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Modify shift cell rendering

  - [x] 6.1 Replace createShiftSelector() with createShiftCell() function

    - Handle empty cells with clickable "+ Add Shift" placeholder
    - Handle custom assignments with time range display and overnight indicator
    - Handle predefined assignments with shift name and details
    - Add onclick handlers to open time entry modal
    - Properly escape JSON data in onclick attributes
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 5.3_

  - [x] 6.2 Update buildScheduleGrid() function to use createShiftCell()

    - Replace the createShiftSelector() call with createShiftCell()
    - Pass full assignment object instead of just shiftName
    - Ensure proper handling of null/undefined assignments
    - _Requirements: 1.1, 1.2, 1.5_

- [x] 7. Update hours calculation to support custom shifts

  - [x] 7.1 Update calculateEmployeeWeeklyHours() function

    - Ensure it correctly handles both custom and predefined shifts
    - Use the isOvernight flag when calculating custom shift hours
    - _Requirements: 2.1, 2.2, 2.4, 5.4_

  - [x] 7.2 Update calculateTotalScheduledHours() function

    - Handle custom shifts by reading start/end times directly from assignment
    - Handle predefined shifts by looking up shift details
    - Use isOvernight flag for accurate calculations
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 7.3 Update updateDashboardStats() function

    - Ensure total store hours includes custom shifts
    - Ensure manager's scheduled hours calculator includes custom shifts
    - _Requirements: 2.4_

- [x] 8. Add data normalization for backward compatibility

  - [x] 8.1 Create normalizeScheduleAssignment() helper function

    - Add default values for isCustom (false) and isOvernight (false)
    - Return normalized assignment object
    - _Requirements: 1.4, 3.4_

  - [x] 8.2 Update loadScheduleForDate() to normalize loaded data

    - Apply normalization to schedule data loaded from localStorage
    - Ensure all assignments have isCustom and isOvernight fields
    - _Requirements: 1.4, 3.4_

- [x] 9. Add helper utility functions

  - [x] 9.1 Implement formatDateDisplay() function

    - Convert ISO date string to user-friendly format
    - Use for modal date display
    - _Requirements: 1.1, 1.2_

  - [x] 9.2 Add validation helper functions

    - Create validateTimeFormat() to check HH:MM format
    - Create validateTimeOrder() to check end > start
    - Use in saveShiftAssignment()
    - _Requirements: 1.3, 5.1_

- [ ]\* 10. Testing and validation

  - [ ]\* 10.1 Test basic custom time entry workflow

    - Click empty cell → Enter custom times → Save → Verify display
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [ ]\* 10.2 Test overnight shift handling

    - Enter overnight shift times → Check overnight box → Verify calculation
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]\* 10.3 Test predefined shift selection

    - Select predefined shift → Verify preview → Save → Verify display
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]\* 10.4 Test editing existing assignments

    - Click cell with custom shift → Modify times → Save → Verify update
    - Click cell with predefined shift → Switch to custom → Save → Verify
    - _Requirements: 1.2, 2.3, 3.3_

  - [ ]\* 10.5 Test clear shift functionality

    - Open modal for existing shift → Clear → Confirm → Verify removal
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]\* 10.6 Test hours calculation accuracy

    - Create various shifts → Verify weekly hours update correctly
    - Verify manager's hours calculator includes custom shifts
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]\* 10.7 Test data persistence

    - Create custom shifts → Refresh page → Verify data persists
    - _Requirements: 1.4, 3.4_

  - [ ]\* 10.8 Test validation and error handling
    - Try to save without times → Verify error message
    - Enter end time before start time without overnight → Verify warning
    - _Requirements: 1.3, 5.1_
