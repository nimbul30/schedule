# Requirements Document

## Introduction

This feature enables managers to manually specify exact clock-in and clock-out times for employee shifts in the weekly schedule. Currently, the system appears to use predefined shift types with fixed start and end times. This enhancement will allow managers to override or directly input custom time ranges for individual employee shifts, providing greater flexibility for handling irregular schedules, partial shifts, or specific coverage needs.

## Glossary

- **Schedule System**: The Google Apps Script-based employee scheduling application that manages shift assignments
- **Manager**: An authorized user with permissions to create and modify employee schedules
- **Shift Cell**: A table cell in the weekly schedule grid representing an employee's assignment for a specific day
- **Time Entry Interface**: The user interface component that allows manual input of clock-in and clock-out times
- **Schedule Grid**: The weekly schedule table displaying employees (rows) and days (columns)
- **Custom Time Shift**: A shift assignment with manually specified start and end times rather than a predefined shift type

## Requirements

### Requirement 1

**User Story:** As a manager, I want to manually enter clock-in and clock-out times for an employee's shift, so that I can schedule custom hours that don't match predefined shift types.

#### Acceptance Criteria

1. WHEN the Manager clicks on an empty shift cell in the Schedule Grid, THEN the Schedule System SHALL display the Time Entry Interface with fields for clock-in time and clock-out time.

2. WHEN the Manager clicks on an existing shift cell in the Schedule Grid, THEN the Schedule System SHALL display the Time Entry Interface pre-populated with the current clock-in time and clock-out time.

3. WHEN the Manager enters a clock-in time and a clock-out time in the Time Entry Interface, THEN the Schedule System SHALL validate that the clock-out time occurs after the clock-in time.

4. WHEN the Manager submits valid clock-in and clock-out times through the Time Entry Interface, THEN the Schedule System SHALL save the Custom Time Shift to the underlying data store.

5. WHEN the Schedule System saves a Custom Time Shift, THEN the Schedule System SHALL display the time range in the Shift Cell using the format "HH:MM - HH:MM".

### Requirement 2

**User Story:** As a manager, I want to see the total hours for manually entered shifts, so that I can track scheduled hours accurately.

#### Acceptance Criteria

1. WHEN the Schedule System displays a Custom Time Shift in a Shift Cell, THEN the Schedule System SHALL calculate the duration between clock-in time and clock-out time.

2. WHEN the Schedule System calculates shift duration, THEN the Schedule System SHALL display the total hours in the Shift Cell alongside the time range.

3. WHEN the Manager modifies the clock-in time or clock-out time of a Custom Time Shift, THEN the Schedule System SHALL recalculate and update the displayed duration.

4. WHEN the Schedule System updates the Manager's Hours Calculator, THEN the Schedule System SHALL include hours from all Custom Time Shifts in the total scheduled hours.

### Requirement 3

**User Story:** As a manager, I want to choose between predefined shift types and manual time entry, so that I can use the most appropriate scheduling method for each situation.

#### Acceptance Criteria

1. WHEN the Manager opens the Time Entry Interface for a shift cell, THEN the Schedule System SHALL provide options to select a predefined shift type or enter custom times.

2. WHEN the Manager selects a predefined shift type in the Time Entry Interface, THEN the Schedule System SHALL auto-populate the clock-in time and clock-out time fields with the shift type's default times.

3. WHEN the Manager switches from predefined shift type to custom time entry, THEN the Schedule System SHALL allow the Manager to modify the auto-populated times.

4. WHEN the Manager saves a shift using custom times, THEN the Schedule System SHALL store the shift as a Custom Time Shift independent of predefined shift types.

### Requirement 4

**User Story:** As a manager, I want to clear or delete manually entered shift times, so that I can remove incorrect or outdated schedule entries.

#### Acceptance Criteria

1. WHEN the Manager opens the Time Entry Interface for an existing Custom Time Shift, THEN the Schedule System SHALL display a delete or clear option.

2. WHEN the Manager activates the delete option for a Custom Time Shift, THEN the Schedule System SHALL remove the shift assignment from the Schedule Grid.

3. WHEN the Schedule System removes a Custom Time Shift, THEN the Schedule System SHALL update the Manager's Hours Calculator to reflect the removed hours.

4. WHEN the Schedule System removes a Custom Time Shift, THEN the Schedule System SHALL display the Shift Cell as empty and available for new assignments.

### Requirement 5

**User Story:** As a manager, I want the system to handle overnight shifts when entering manual times, so that I can accurately schedule shifts that span across midnight.

#### Acceptance Criteria

1. WHEN the Manager enters a clock-out time that is earlier than the clock-in time in the Time Entry Interface, THEN the Schedule System SHALL interpret the shift as spanning across midnight to the next day.

2. WHEN the Schedule System calculates duration for an overnight Custom Time Shift, THEN the Schedule System SHALL correctly compute hours across the midnight boundary.

3. WHEN the Schedule System displays an overnight Custom Time Shift, THEN the Schedule System SHALL indicate the shift continues to the next day using visual formatting or notation.

4. WHEN the Manager's Hours Calculator includes overnight shifts, THEN the Schedule System SHALL attribute the hours to the day on which the shift begins.
