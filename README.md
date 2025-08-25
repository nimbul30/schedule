# 🚀 Enhanced Employee Scheduling Webapp

A powerful, feature-rich employee scheduling system built with Google Apps Script, featuring a modern UI, advanced analytics, and comprehensive management tools.

## ✨ Features

### 🎯 Core Functionality

- **Employee Management**: Add, edit, and delete employees with detailed profiles
- **Shift Management**: Create and manage different shift types with custom colors
- **Schedule Creation**: Intuitive drag-and-drop scheduling interface
- **Time-Off Requests**: Employee self-service time-off request system
- **Role-Based Access**: Different views for managers and employees

### 🔥 Enhanced Features

#### 📊 Dashboard & Analytics

- **Real-time Statistics**: Employee count, scheduled shifts, pending requests, coverage rates
- **Advanced Analytics**: Workload distribution, shift analysis, coverage reports
- **Visual Charts**: Employee workload charts and shift distribution graphs
- **Trend Analysis**: Time-off patterns and scheduling trends

#### ⚡ Productivity Tools

- **Bulk Scheduling**: Assign multiple employees to shifts at once
- **Schedule Templates**: Save and reuse common scheduling patterns
- **Quick Actions**: Fast access to common tasks
- **Export Functionality**: Export schedules to various formats

#### 🎨 User Experience

- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Modern UI with engaging transitions
- **Smart Notifications**: Real-time feedback and status updates
- **Enhanced Modals**: Beautiful, accessible modal dialogs

#### 🔧 Advanced Management

- **Conflict Detection**: Automatic detection of scheduling conflicts
- **Validation System**: Comprehensive form validation and error handling
- **Settings Panel**: Customizable app preferences
- **Notification Center**: Centralized notification management
- **Auto-save**: Automatic saving of changes

### 👥 User Roles

#### 🏢 Manager View

- Full dashboard with statistics and analytics
- Employee and shift management
- Bulk scheduling operations
- Time-off request approval/denial
- Schedule publishing and export
- Advanced analytics and reporting

#### 👤 Employee View

- Personal dashboard with mini-stats
- Schedule viewing with enhanced cards
- Time-off request submission
- Request history and status tracking
- Mobile-optimized interface

## 🛠️ Technical Features

### 🏗️ Architecture

- **Frontend**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Authentication**: Google Account integration
- **Hosting**: Google Apps Script Web App

### 🔒 Security

- Role-based access control
- Email validation and duplicate prevention
- Input sanitization and validation
- Secure session management

### 📱 Responsive Design

- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interfaces
- Optimized for all screen sizes

## 🚀 Getting Started

### Prerequisites

- Google Account
- Google Sheets access
- Basic understanding of Google Apps Script

### Installation

1. Create a new Google Apps Script project
2. Copy the code files into your project:
   - `code.js` - Server-side functions
   - `webapp.html` - Manager interface
   - `EmployeeView.html` - Employee interface
   - `admin.html` - Admin forms
3. Create a Google Spreadsheet and note the ID
4. Update the `SPREADSHEET_ID` constant in `code.js`
5. Deploy as a web app
6. Set up initial employees and shifts

### Configuration

1. **Spreadsheet Setup**: The app automatically creates required sheets
2. **Employee Setup**: Add initial employees through the admin interface
3. **Shift Configuration**: Create shift types with times and colors
4. **Role Assignment**: Assign manager roles to authorized users

## 📋 Usage Guide

### For Managers

1. **Dashboard Overview**: View key metrics and statistics
2. **Employee Management**: Add/edit/delete employees
3. **Schedule Creation**: Use the weekly grid to assign shifts
4. **Bulk Operations**: Use bulk scheduling for efficiency
5. **Analytics**: Review workload and coverage reports
6. **Publishing**: Export and share schedules

### For Employees

1. **View Schedule**: Check your weekly assignments
2. **Request Time Off**: Submit time-off requests
3. **Track Requests**: Monitor request status
4. **Personal Stats**: View your work hours and shifts

## 🎨 Customization

### Themes

- Toggle between light and dark modes
- Customizable color schemes
- Responsive design elements

### Settings

- Auto-save preferences
- Email notification settings
- Time format options
- Default view preferences

## 🔧 Advanced Features

### Templates

- Save current schedules as templates
- Apply templates to new weeks
- Template management and organization

### Analytics

- Employee workload analysis
- Shift distribution reports
- Coverage rate calculations
- Time-off trend analysis

### Bulk Operations

- Multi-employee shift assignment
- Batch schedule updates
- Conflict detection and resolution

## 📊 Data Structure

### Sheets Created

- **Employees**: Staff information and roles
- **Shifts**: Shift types and schedules
- **Schedule_Log**: Daily shift assignments
- **TimeOffRequests**: Time-off request tracking
- **Schedule_Templates**: Saved schedule patterns

## 🐛 Error Handling

### Client-Side

- Form validation and feedback
- Network error handling
- User-friendly error messages
- Automatic retry mechanisms

### Server-Side

- Comprehensive error logging
- Data validation and sanitization
- Graceful error recovery
- Detailed error reporting

## 🔄 Updates & Maintenance

### Regular Tasks

- Review and approve time-off requests
- Update employee information
- Maintain shift schedules
- Monitor system performance

### Data Backup

- Regular spreadsheet backups
- Template preservation
- Historical data retention

## 🤝 Contributing

This is a demonstration project showcasing advanced Google Apps Script capabilities. Feel free to:

- Suggest improvements
- Report issues
- Share enhancement ideas
- Contribute to documentation

## 📄 License

This project is provided as-is for educational and demonstration purposes.

## 🎉 Conclusion

This enhanced scheduling webapp demonstrates the power of modern web technologies combined with Google Apps Script. With its comprehensive feature set, intuitive interface, and robust architecture, it provides a complete solution for employee scheduling needs.

### Key Highlights:

- ✅ Modern, responsive UI with dark mode
- ✅ Advanced analytics and reporting
- ✅ Bulk operations and templates
- ✅ Comprehensive error handling
- ✅ Role-based access control
- ✅ Mobile-optimized experience
- ✅ Real-time notifications
- ✅ Extensive customization options

Ready to revolutionize your scheduling process! 🚀
