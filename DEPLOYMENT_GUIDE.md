# Dunham's Scheduler - Deployment Guide

## ✅ COMPLETE! Both Versions Ready

### Version 1: Standalone (index.html)

**Status:** ✅ Fully functional
**Storage:** Browser localStorage
**Best For:** Single computer, testing, offline use

### Version 2: Google Sheets Backend (webapp.html)

**Status:** ✅ Fully functional with cloud storage
**Storage:** Google Sheets
**Best For:** Production, multiple devices, team collaboration

---

## 🚀 Quick Start - Google Sheets Version

### Step 1: Deploy to Google Apps Script

The code is already pushed! Now deploy it:

1. Open your Apps Script project:

   ```
   clasp open-script
   ```

2. In the Apps Script editor:

   - Click **Deploy** → **New deployment**
   - Select type: **Web app**
   - Description: "Dunham's Scheduler v1"
   - Execute as: **Me**
   - Who has access: **Anyone** (or your preference)
   - Click **Deploy**

3. Copy the web app URL

### Step 2: Initialize the Database

First time only - run this to create the Google Sheets database:

1. In Apps Script editor, select function: `initializeDefaultData`
2. Click **Run**
3. Authorize the script when prompted
4. Check execution log - you'll see the Google Sheets URL

### Step 3: Test the App

1. Open the web app URL from Step 1
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. You should see the manager dashboard!

---

## 📊 What's Integrated with Google Sheets

### ✅ Authentication

- User login validates against Google Sheets
- Passwords stored in Users sheet
- Role-based access (manager/employee)

### ✅ Employee Management

- Add employees → Saves to Google Sheets
- Employees appear across all devices
- Automatic user account creation

### ✅ Shift Management

- Add shifts → Saves to Google Sheets
- Shifts available to all users
- Persistent across sessions

### ✅ Schedule Management

- Assign shifts → Saves to Google Sheets
- View schedule → Loads from Google Sheets
- Delete shifts → Removes from Google Sheets
- All changes sync immediately

---

## 🔄 Data Flow

```
User Action → webapp.html → SheetsAPI wrapper → Google Apps Script → Google Sheets
                                                                            ↓
User sees result ← webapp.html ← Response ← Google Apps Script ← Google Sheets
```

---

## 📁 Google Sheets Structure

Your data is stored in a Google Sheet with these tabs:

### 1. Users Sheet

| Username | Password | Role    | Display Name | Created   |
| -------- | -------- | ------- | ------------ | --------- |
| admin    | admin123 | manager | Admin        | timestamp |

### 2. Employees Sheet

| Name     | Email            | Role    | Username | Created   |
| -------- | ---------------- | ------- | -------- | --------- |
| John Doe | john@example.com | Cashier | johnd    | timestamp |

### 3. Shifts Sheet

| Name    | Start Time | End Time | Created   |
| ------- | ---------- | -------- | --------- |
| Morning | 06:00      | 14:00    | timestamp |

### 4. Schedule Sheet

| Employee Name | Date       | Shift Name | Start Time | End Time | Is Custom | Is Overnight | Created   |
| ------------- | ---------- | ---------- | ---------- | -------- | --------- | ------------ | --------- |
| John Doe      | 2025-11-20 | Morning    | 06:00      | 14:00    | FALSE     | FALSE        | timestamp |

---

## 🎯 Key Features

### Security

- ✅ Session-based authentication (expires on browser close)
- ✅ No auto-save of credentials
- ✅ Password-protected access
- ✅ Role-based permissions

### Data Persistence

- ✅ All data stored in Google Sheets
- ✅ Survives browser cache clear
- ✅ Accessible from any device
- ✅ Automatic backups (Google Sheets)

### User Experience

- ✅ 12-hour AM/PM time format
- ✅ Separate manager and employee views
- ✅ Loading states for async operations
- ✅ Error handling and notifications

---

## 🔧 Troubleshooting

### "Error connecting to database"

- Check that you've run `initializeDefaultData()`
- Verify script has permissions
- Check Apps Script execution log for errors

### "Invalid username or password"

- Default credentials: admin / admin123
- Check Users sheet in Google Sheets
- Verify data was initialized

### Data not loading

- Check browser console (F12) for errors
- Verify Google Sheets exists
- Check Apps Script execution log
- Ensure script is deployed as web app

### Slow performance

- Normal - Google Sheets API has slight delay
- Loading states show progress
- Consider caching for frequently accessed data

---

## 📝 Adding New Users

### As Manager:

1. Login to webapp
2. Click "Add Employee"
3. Fill in details including username/password
4. Employee can now login with those credentials

### Manually in Google Sheets:

1. Open the Google Sheet (get URL from `initializeDefaultData()`)
2. Go to "Users" tab
3. Add row: username, password, role, display name, date
4. User can now login

---

## 🔄 Migrating from Standalone to Google Sheets

If you have data in the standalone version (index.html):

1. Export data from browser:

   ```javascript
   // In browser console on index.html
   console.log(
     JSON.stringify({
       employees: localStorage.getItem('employees'),
       shifts: localStorage.getItem('shifts'),
       schedule: localStorage.getItem('schedule'),
     })
   );
   ```

2. Manually add to Google Sheets or create import script

---

## 🎉 You're Done!

Your Dunham's Scheduler is now running with Google Sheets backend!

**Web App URL:** (from deployment)
**Google Sheets URL:** (from initializeDefaultData)
**Login:** admin / admin123

### Next Steps:

1. Change default admin password
2. Add your employees
3. Create your shift templates
4. Start scheduling!

### Support:

- Check browser console (F12) for errors
- Check Apps Script execution logs
- Review IMPLEMENTATION_STATUS.md for details

---

## 📊 Comparison

| Feature            | index.html (Standalone) | webapp.html (Google Sheets) |
| ------------------ | ----------------------- | --------------------------- |
| Data Storage       | Browser localStorage    | Google Sheets               |
| Multi-Device       | ❌ No                   | ✅ Yes                      |
| Data Loss Risk     | ⚠️ High (cache clear)   | ✅ None                     |
| Speed              | ⚡ Instant              | 🐢 Slight delay             |
| Offline Mode       | ✅ Yes                  | ❌ No                       |
| Team Collaboration | ❌ No                   | ✅ Yes                      |
| Backup             | ⚠️ Manual               | ✅ Automatic                |
| Setup Complexity   | ✅ Simple               | ⚠️ Moderate                 |

**Recommendation:** Use webapp.html (Google Sheets) for production!
