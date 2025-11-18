# Dunham's Sports Staff Scheduler - Standalone Version

A fully functional staff scheduling application that runs entirely in your browser with no backend required.

## Features

- ✅ **No Server Required** - Runs completely in the browser
- ✅ **Local Storage** - All data saved in browser localStorage
- ✅ **Custom & Predefined Shifts** - Create shifts with custom times or use predefined templates
- ✅ **Time Validation** - Built-in validation for time formats and shift ordering
- ✅ **Employee Management** - Add, edit, and manage employees
- ✅ **Weekly Schedule View** - Visual calendar interface
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile

## Quick Start

### Option 1: Open Locally

Simply open `index.html` in any modern web browser:

- Double-click the file, or
- Right-click → Open with → Your browser

### Option 2: Host on GitHub Pages (Free)

1. Create a new GitHub repository
2. Upload `index.html` to the repository
3. Go to Settings → Pages
4. Select "main" branch and save
5. Your app will be live at `https://yourusername.github.io/repository-name`

### Option 3: Deploy to Netlify (Free)

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `index.html` file
3. Get instant deployment with a custom URL

### Option 4: Deploy to Vercel (Free)

1. Go to [vercel.com](https://vercel.com)
2. Import your project
3. Deploy with one click

## How to Use

### First Time Setup

1. Open the app
2. Sign in with your manager name
3. Add employees using the "Add Employee" button
4. Create shift templates using "Add Shift" button

### Scheduling Shifts

1. Click on any cell in the schedule grid
2. Choose between:
   - **Predefined Shift**: Select from your saved shift templates
   - **Custom Times**: Enter specific clock in/out times
3. The app validates time formats (HH:MM) and ensures end time is after start time
4. Save the shift

### Managing Data

- **Employees**: Add, edit, or delete employees
- **Shifts**: Create reusable shift templates
- **Schedule**: Assign shifts to employees for specific dates
- **Export**: All data is in localStorage - use browser dev tools to export if needed

## Data Storage

All data is stored in your browser's localStorage:

- `employees` - Employee list
- `shifts` - Shift templates
- `schedule` - Shift assignments
- `currentUser` - Current manager info

**Important**:

- Data persists between sessions
- Clearing browser data will delete all schedules
- Data is not shared between different browsers or devices
- Consider exporting important schedules regularly

## Browser Compatibility

Works with all modern browsers:

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Recent Updates

### Task 9: Helper Utility Functions

- ✅ `formatDateDisplay()` - Converts ISO dates to user-friendly format
- ✅ `validateTimeFormat()` - Validates HH:MM time format
- ✅ `validateTimeOrder()` - Ensures end time is after start time
- ✅ Enhanced error messages for invalid inputs
- ✅ Console logging for debugging

## Development

To modify the app:

1. Edit `index.html`
2. Refresh your browser to see changes
3. Use F12 Developer Tools → Console to debug

## Troubleshooting

**Q: My data disappeared!**
A: Check if you cleared browser data. Data is stored in localStorage.

**Q: Validation not working?**
A: Open F12 Console to see validation messages and any errors.

**Q: Can I use this on multiple devices?**
A: Each device stores data separately. Consider using the Google Apps Script version for cloud sync.

**Q: How do I backup my data?**
A: Open F12 Console and run:

```javascript
console.log(
  JSON.stringify({
    employees: localStorage.getItem('employees'),
    shifts: localStorage.getItem('shifts'),
    schedule: localStorage.getItem('schedule'),
  })
);
```

Copy the output to save your data.

## Support

For issues or questions, check the browser console (F12) for error messages.

## License

This is a standalone version of the Dunham's Sports Staff Scheduler.
