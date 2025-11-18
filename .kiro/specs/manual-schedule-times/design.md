# Design Document: Manual Schedule Times

## Overview

This feature extends the existing Google Apps Script scheduling system to allow managers to manually specify exact clock-in and clock-out times for employee shifts. Currently, the system uses a dropdown selector that only allows assignment of predefined shift types. This enhancement will provide a dual-mode interface where managers can either select a predefined shift or enter custom times directly.

The implementation will maintain backward compatibility with existing shift assignments while adding new data structures and UI components to support custom time entries.

## Architecture

### Data Model Changes

The current schedule data structure stores:

```javascript
{
  employeeName: string,
  date: string,        // ISO format YYYY-MM-DD
  shiftName: string,
  start: string,       // HH:MM format
  end: string          // HH:MM format
}
```

We will extend this to support custom times by adding an optional flag:

```javascript
{
  employeeName: string,
  date: string,
  shiftName: string,   // Will be "Custom" for manual entries
  start: string,
  end: string,
  isCustom: boolean,   // New field to distinguish custom vs predefined
  isOvernight: boolean // New field to handle overnight shifts
}
```

### Component Architecture

```
┌─────────────────────────────────────────┐
│         Schedule Grid (Table)           │
│  ┌────────────────────────────────────┐ │
│  │  Shift Cell (Click Handler)        │ │
│  └────────────┬───────────────────────┘ │
└───────────────┼─────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│    Time Entry Modal                       │
│  ┌─────────────────────────────────────┐  │
│  │  Mode Selector                      │  │
│  │  ○ Predefined Shift  ○ Custom Time │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  Shift Selector (if predefined)     │  │
│  │  OR                                 │  │
│  │  Time Inputs (if custom)            │  │
│  │    Clock In:  [HH:MM]              │  │
│  │    Clock Out: [HH:MM]              │  │
│  │    ☐ Overnight shift               │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  Duration Display: X.X hours        │  │
│  └─────────────────────────────────────┘  │
│  [Save] [Clear] [Cancel]                  │
└───────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────┐
│    Data Persistence (localStorage)        │
└───────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Time Entry Modal

**Purpose**: Provide a unified interface for both predefined shift selection and custom time entry.

**HTML Structure**:

```html
<div id="time-entry-modal" class="modal">
  <div class="modal-content">
    <span class="close-button" onclick="closeTimeEntryModal()">×</span>
    <h2 class="text-2xl font-bold mb-6 text-gray-800">Schedule Shift</h2>

    <!-- Employee and Date Info -->
    <div class="mb-4 p-3 bg-gray-50 rounded">
      <p><strong>Employee:</strong> <span id="modal-employee-name"></span></p>
      <p><strong>Date:</strong> <span id="modal-date"></span></p>
    </div>

    <!-- Mode Selector -->
    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2"
        >Shift Type</label
      >
      <div class="flex space-x-4">
        <label class="flex items-center">
          <input
            type="radio"
            name="shift-mode"
            value="predefined"
            checked
            onchange="toggleShiftMode('predefined')"
            class="mr-2"
          />
          <span>Predefined Shift</span>
        </label>
        <label class="flex items-center">
          <input
            type="radio"
            name="shift-mode"
            value="custom"
            onchange="toggleShiftMode('custom')"
            class="mr-2"
          />
          <span>Custom Times</span>
        </label>
      </div>
    </div>

    <!-- Predefined Shift Selector -->
    <div id="predefined-shift-section" class="mb-4">
      <label class="block text-gray-700 text-sm font-bold mb-2"
        >Select Shift</label
      >
      <select
        id="modal-shift-select"
        class="w-full p-2 border rounded"
        onchange="updateTimePreview()"
      >
        <option value="">-- Select Shift --</option>
      </select>
    </div>

    <!-- Custom Time Entry -->
    <div id="custom-time-section" class="mb-4 hidden">
      <div class="grid grid-cols-2 gap-4 mb-3">
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2"
            >Clock In</label
          >
          <input
            type="time"
            id="custom-start-time"
            class="w-full p-2 border rounded"
            onchange="calculateCustomDuration()"
          />
        </div>
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2"
            >Clock Out</label
          >
          <input
            type="time"
            id="custom-end-time"
            class="w-full p-2 border rounded"
            onchange="calculateCustomDuration()"
          />
        </div>
      </div>
      <label class="flex items-center">
        <input
          type="checkbox"
          id="overnight-checkbox"
          class="mr-2"
          onchange="calculateCustomDuration()"
        />
        <span class="text-sm">This shift continues past midnight</span>
      </label>
    </div>

    <!-- Duration Display -->
    <div class="mb-6 p-3 bg-blue-50 rounded">
      <p class="text-sm text-gray-700">
        <strong>Duration:</strong>
        <span id="shift-duration" class="text-blue-900 font-bold">--</span>
      </p>
      <p id="time-range-display" class="text-xs text-gray-600 mt-1"></p>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-between">
      <button
        onclick="clearShift()"
        class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
      >
        Clear Shift
      </button>
      <div class="space-x-2">
        <button
          onclick="closeTimeEntryModal()"
          class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
        >
          Cancel
        </button>
        <button
          onclick="saveShiftAssignment()"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</div>
```

### 2. Modified Shift Cell Rendering

**Current Implementation**:

```javascript
function createShiftSelector(employeeName, date, selectedShift) {
  // Returns a <select> dropdown
}
```

**New Implementation**:

```javascript
function createShiftCell(employeeName, date, assignment) {
  if (!assignment) {
    // Empty cell - show clickable placeholder
    return `<div class="shift-cell-empty" onclick="openTimeEntryModal('${employeeName}', '${date}', null)">
              <span class="text-gray-400 text-sm">+ Add Shift</span>
            </div>`;
  } else if (assignment.isCustom) {
    // Custom time assignment - show time range
    const hours = calculateShiftHours(
      assignment.start,
      assignment.end,
      assignment.isOvernight
    );
    const overnightBadge = assignment.isOvernight
      ? '<span class="text-xs">🌙</span>'
      : '';
    return `<div class="shift-cell-custom" onclick="openTimeEntryModal('${employeeName}', '${date}', ${JSON.stringify(
      assignment
    ).replace(/"/g, '&quot;')})">
              <div class="font-medium text-sm">${assignment.start} - ${
      assignment.end
    } ${overnightBadge}</div>
              <div class="text-xs text-gray-600">${hours}h</div>
            </div>`;
  } else {
    // Predefined shift - show shift name
    const shift = allShifts.find((s) => s.name === assignment.shiftName);
    const hours = shift ? calculateShiftHours(shift.start, shift.end) : 0;
    return `<div class="shift-cell-predefined" onclick="openTimeEntryModal('${employeeName}', '${date}', ${JSON.stringify(
      assignment
    ).replace(/"/g, '&quot;')})">
              <div class="font-medium text-sm">${assignment.shiftName}</div>
              <div class="text-xs text-gray-600">${assignment.start} - ${
      assignment.end
    } (${hours}h)</div>
            </div>`;
  }
}
```

### 3. Core JavaScript Functions

#### Modal Management

```javascript
let currentModalContext = {
  employeeName: null,
  date: null,
  existingAssignment: null,
};

function openTimeEntryModal(employeeName, date, assignment) {
  currentModalContext = { employeeName, date, existingAssignment: assignment };

  // Populate modal header
  document.getElementById('modal-employee-name').textContent = employeeName;
  document.getElementById('modal-date').textContent = formatDateDisplay(date);

  // Populate shift selector
  const shiftSelect = document.getElementById('modal-shift-select');
  shiftSelect.innerHTML = '<option value="">-- Select Shift --</option>';
  allShifts.forEach((shift) => {
    const hours = calculateShiftHours(shift.start, shift.end);
    shiftSelect.innerHTML += `<option value="${shift.name}">${shift.name} (${shift.start} - ${shift.end}) - ${hours}h</option>`;
  });

  // If editing existing assignment
  if (assignment) {
    if (assignment.isCustom) {
      // Switch to custom mode
      document.querySelector(
        'input[name="shift-mode"][value="custom"]'
      ).checked = true;
      toggleShiftMode('custom');
      document.getElementById('custom-start-time').value = assignment.start;
      document.getElementById('custom-end-time').value = assignment.end;
      document.getElementById('overnight-checkbox').checked =
        assignment.isOvernight || false;
      calculateCustomDuration();
    } else {
      // Predefined mode
      document.querySelector(
        'input[name="shift-mode"][value="predefined"]'
      ).checked = true;
      toggleShiftMode('predefined');
      shiftSelect.value = assignment.shiftName;
      updateTimePreview();
    }
  } else {
    // New assignment - default to predefined mode
    document.querySelector(
      'input[name="shift-mode"][value="predefined"]'
    ).checked = true;
    toggleShiftMode('predefined');
  }

  // Show modal
  document.getElementById('time-entry-modal').style.display = 'flex';
}

function closeTimeEntryModal() {
  document.getElementById('time-entry-modal').style.display = 'none';
  currentModalContext = {
    employeeName: null,
    date: null,
    existingAssignment: null,
  };
}

function toggleShiftMode(mode) {
  const predefinedSection = document.getElementById('predefined-shift-section');
  const customSection = document.getElementById('custom-time-section');

  if (mode === 'predefined') {
    predefinedSection.classList.remove('hidden');
    customSection.classList.add('hidden');
    updateTimePreview();
  } else {
    predefinedSection.classList.add('hidden');
    customSection.classList.remove('hidden');
    calculateCustomDuration();
  }
}
```

#### Time Calculation

```javascript
function calculateShiftHours(startTime, endTime, isOvernight = false) {
  if (!startTime || !endTime) return 0;

  const start = new Date(`2000-01-01 ${startTime}`);
  let end = new Date(`2000-01-01 ${endTime}`);

  let hours = (end - start) / (1000 * 60 * 60);

  // Handle overnight shifts
  if (isOvernight || hours < 0) {
    hours += 24;
  }

  return Math.round(hours * 100) / 100;
}

function calculateCustomDuration() {
  const startTime = document.getElementById('custom-start-time').value;
  const endTime = document.getElementById('custom-end-time').value;
  const isOvernight = document.getElementById('overnight-checkbox').checked;

  if (!startTime || !endTime) {
    document.getElementById('shift-duration').textContent = '--';
    document.getElementById('time-range-display').textContent = '';
    return;
  }

  const hours = calculateShiftHours(startTime, endTime, isOvernight);
  document.getElementById('shift-duration').textContent = `${hours} hours`;

  const overnightText = isOvernight ? ' (continues to next day)' : '';
  document.getElementById(
    'time-range-display'
  ).textContent = `${startTime} - ${endTime}${overnightText}`;
}

function updateTimePreview() {
  const shiftSelect = document.getElementById('modal-shift-select');
  const shiftName = shiftSelect.value;

  if (!shiftName) {
    document.getElementById('shift-duration').textContent = '--';
    document.getElementById('time-range-display').textContent = '';
    return;
  }

  const shift = allShifts.find((s) => s.name === shiftName);
  if (shift) {
    const hours = calculateShiftHours(shift.start, shift.end);
    document.getElementById('shift-duration').textContent = `${hours} hours`;
    document.getElementById(
      'time-range-display'
    ).textContent = `${shift.start} - ${shift.end}`;
  }
}
```

#### Data Persistence

```javascript
function saveShiftAssignment() {
  const { employeeName, date } = currentModalContext;
  const mode = document.querySelector('input[name="shift-mode"]:checked').value;

  let newAssignment = null;

  if (mode === 'predefined') {
    const shiftName = document.getElementById('modal-shift-select').value;
    if (!shiftName) {
      showNotification('Please select a shift', 'warning');
      return;
    }

    const shift = allShifts.find((s) => s.name === shiftName);
    newAssignment = {
      employeeName,
      date,
      shiftName: shift.name,
      start: shift.start,
      end: shift.end,
      isCustom: false,
      isOvernight: false,
    };
  } else {
    const startTime = document.getElementById('custom-start-time').value;
    const endTime = document.getElementById('custom-end-time').value;
    const isOvernight = document.getElementById('overnight-checkbox').checked;

    if (!startTime || !endTime) {
      showNotification('Please enter both start and end times', 'warning');
      return;
    }

    // Validate times
    if (!isOvernight) {
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      if (end <= start) {
        showNotification(
          'End time must be after start time, or check "overnight shift"',
          'warning'
        );
        return;
      }
    }

    newAssignment = {
      employeeName,
      date,
      shiftName: 'Custom',
      start: startTime,
      end: endTime,
      isCustom: true,
      isOvernight,
    };
  }

  // Update schedule in localStorage
  let schedule = JSON.parse(localStorage.getItem('schedule') || '[]');

  // Remove existing assignment for this employee and date
  schedule = schedule.filter(
    (s) => !(s.employeeName === employeeName && s.date === date)
  );

  // Add new assignment
  schedule.push(newAssignment);

  // Save
  localStorage.setItem('schedule', JSON.stringify(schedule));

  // Close modal and refresh
  closeTimeEntryModal();
  showNotification('Shift saved successfully', 'success');
  loadScheduleForDate(currentStartDate);
}

function clearShift() {
  const { employeeName, date } = currentModalContext;

  if (!confirm('Are you sure you want to clear this shift?')) {
    return;
  }

  // Remove assignment from schedule
  let schedule = JSON.parse(localStorage.getItem('schedule') || '[]');
  schedule = schedule.filter(
    (s) => !(s.employeeName === employeeName && s.date === date)
  );
  localStorage.setItem('schedule', JSON.stringify(schedule));

  // Close modal and refresh
  closeTimeEntryModal();
  showNotification('Shift cleared', 'info');
  loadScheduleForDate(currentStartDate);
}
```

## Data Models

### Schedule Assignment Object

```typescript
interface ScheduleAssignment {
  employeeName: string; // Employee identifier
  date: string; // ISO date string (YYYY-MM-DD)
  shiftName: string; // Shift name or "Custom"
  start: string; // Start time in HH:MM format
  end: string; // End time in HH:MM format
  isCustom: boolean; // True for manual time entry
  isOvernight?: boolean; // True if shift spans midnight
}
```

### Modal Context Object

```typescript
interface ModalContext {
  employeeName: string | null;
  date: string | null;
  existingAssignment: ScheduleAssignment | null;
}
```

## Error Handling

### Validation Rules

1. **Time Entry Validation**:

   - Both start and end times must be provided
   - If not marked as overnight, end time must be after start time
   - Times must be in valid HH:MM format

2. **Overnight Shift Detection**:

   - If end time is earlier than start time, prompt user to check overnight box
   - Display clear visual indicator for overnight shifts

3. **Data Integrity**:
   - Prevent duplicate assignments for same employee/date combination
   - Validate that employee and date exist before saving

### Error Messages

```javascript
const ERROR_MESSAGES = {
  MISSING_TIMES: 'Please enter both start and end times',
  INVALID_TIME_ORDER:
    'End time must be after start time, or check "overnight shift"',
  NO_SHIFT_SELECTED: 'Please select a shift',
  SAVE_FAILED: 'Failed to save shift assignment. Please try again.',
  INVALID_TIME_FORMAT: 'Please enter times in HH:MM format',
};
```

## Testing Strategy

### Unit Tests

1. **Time Calculation Tests**:

   - Test `calculateShiftHours()` with various time ranges
   - Test overnight shift calculations
   - Test edge cases (midnight, same time, etc.)

2. **Validation Tests**:
   - Test time validation logic
   - Test overnight detection
   - Test data format validation

### Integration Tests

1. **Modal Workflow**:

   - Open modal → Select predefined shift → Save
   - Open modal → Enter custom times → Save
   - Open modal → Edit existing assignment → Save
   - Open modal → Clear shift → Confirm

2. **Data Persistence**:

   - Save custom shift → Reload page → Verify data persists
   - Save predefined shift → Switch to custom → Save → Verify update
   - Clear shift → Verify removal from localStorage

3. **UI Updates**:
   - Save shift → Verify cell updates immediately
   - Save shift → Verify weekly hours recalculate
   - Save shift → Verify hours calculator updates

### Manual Testing Scenarios

1. **Basic Custom Time Entry**:

   - Click empty cell
   - Switch to custom mode
   - Enter 9:00 AM - 5:00 PM
   - Verify 8 hours displayed
   - Save and verify cell shows "09:00 - 17:00 (8h)"

2. **Overnight Shift**:

   - Enter 11:00 PM - 7:00 AM
   - Check overnight box
   - Verify 8 hours calculated
   - Save and verify overnight indicator displayed

3. **Switch Between Modes**:

   - Select predefined shift
   - Switch to custom mode
   - Verify times pre-populated
   - Modify times
   - Save and verify custom assignment

4. **Edit Existing Assignment**:

   - Click cell with existing shift
   - Modify times
   - Save and verify update
   - Verify hours recalculated

5. **Clear Shift**:
   - Click cell with assignment
   - Click "Clear Shift"
   - Confirm deletion
   - Verify cell becomes empty

## CSS Styling

```css
/* Shift Cell Styles */
.shift-cell-empty {
  padding: 0.5rem;
  text-align: center;
  border: 2px dashed #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shift-cell-empty:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.shift-cell-custom,
.shift-cell-predefined {
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 60px;
}

.shift-cell-custom {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
}

.shift-cell-custom:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
}

.shift-cell-predefined {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 2px solid #3b82f6;
}

.shift-cell-predefined:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

/* Time Entry Modal Specific Styles */
#time-entry-modal .modal-content {
  max-width: 500px;
}

#time-entry-modal input[type='time'] {
  font-size: 1rem;
  padding: 0.75rem;
}

#time-entry-modal input[type='radio'] {
  width: 1.25rem;
  height: 1.25rem;
}
```

## Migration Strategy

### Backward Compatibility

Existing schedule data will continue to work without modification. The system will:

1. Treat all existing assignments as predefined shifts (isCustom = false)
2. Automatically populate the isCustom field when loading old data
3. Maintain the existing dropdown selector behavior for users who don't use the new feature

### Data Migration

No explicit migration needed. The system will handle both formats:

```javascript
function normalizeScheduleAssignment(assignment) {
  return {
    ...assignment,
    isCustom: assignment.isCustom || false,
    isOvernight: assignment.isOvernight || false,
  };
}
```

## Performance Considerations

1. **Modal Rendering**: Modal HTML is pre-rendered in the page, only populated on open
2. **Cell Rendering**: Shift cells use onclick handlers instead of event delegation for simplicity
3. **Data Storage**: localStorage operations are batched (single write per save operation)
4. **Recalculation**: Hours are recalculated only when schedule changes, not on every render

## Future Enhancements

1. **Time Validation**: Add more sophisticated validation (e.g., prevent overlapping shifts)
2. **Quick Time Presets**: Add buttons for common durations (4h, 6h, 8h)
3. **Copy/Paste Shifts**: Allow copying a shift to multiple days
4. **Shift Templates**: Save custom time ranges as reusable templates
5. **Break Time**: Add optional break time deduction from total hours
6. **Conflict Detection**: Warn if employee is scheduled for overlapping times
