# Features
- Unlimited user accounts (With permissions control)
- Daily booking limits
- Data collection (For analytics)
- Tablet displays
- Room map with room status (Requires a little bit more setup)

# Why it exists
This hacky little project was made for District 3, Concordia University's startup incubator, as a stop gap. No booking platform fit our use case perfectly and provided an acceptable amount of features for the price they demanded ($50/room per month? $3 per user per month?) 

We needed a solution that provided unlimited user accounts due to our constant flow of startup founders that also integrated well with Google Calendar resources, so our internal employees could continue to book rooms through Google Workspace workflows without fear of double booking. 

# How it works
## "Butler" Accounts
- A Google Workspace account is created for each room we want to be bookable. These accounts have “Make changes to events” permissions granted to them for their respective room’s resource calendar.
### Appointment Schedule
- Within each account, a Google Appointment Schedule is created that will be used for the platform users to book time slots in the accounts calendar. The Appointment Schedule has a few changes made to it to ensure a consistent experience.
    - Under “Calendars checked for availability” the Appointment Schedule must look for conflicts in both the accounts calendar as well as the room Resource Calendar. To enable this, the calendar must be enabled on the account.
### Apps Script
- Each of these butler accounts is running their own GAS project with the code in the BookingAgent folder, with a "Calendar - Changed" trigger that runs the main() function. The calendar it is watching is the same calendar that the Appointment Schedule is using.
- They also have another project running the code in the RoomTablets folder, deployed as a Web App. This Web App is used to display the room status on a tablet outside of the room.
    - This project consists of three components: the JavaScript (Google Apps Script), the HTML (webpage structure and styling), and the iframe (iframe is used because it allows us to hide the warning banner Google puts on any Google Apps Script Web App).
### Google Sheets & Forms
- All of the butler accounts check a single Google Sheet before duplicating events over to the resource calendar. When the user creates a booking, the script first check a tab called 'Form Responses', which is where signups are dumped by a Google Sheet. 
- The script looks for the booker's email in column B and if they are an approved user in Column H. If they are, the script will duplicate the event over to the resource calendar and log the event in a separate tab called 'Bookings'. If they are not, the script will send an email to the booker notifying them that they are not an approved user.
- Additionally, the script will check the 'Bookings' tab to see if the user has already booked twice that day, and if they have, it will send them an email notifying them that they have reached their daily booking limit.
## Account Manager
- Another Google Workspace account runs the script in the AccountManager folder (Created attached to the sheet via clicking Extensions -> Apps Script on the sheet). This handles sending out acceptance/denial emails to users who sign up for the platform.

# Setup
1. Create your Google Form. This form should collect Email, First Name, Last Name
2. Create the Google Sheet that will be used to store the form responses. This sheet should have two tabs: 'Form Responses' and 'Bookings'. 'Form Responses' should have column B be user's emails, and column H be a checkbox for whether or not they are an approved user.
3. Create a Google Workspace account for your first room. Share the resource calendar of the room with this account with the permission "Make changes to events" permission. Create a Google Apps Script project with the code in the BookingAgent folder (Configured to your setup). Create a trigger for the main() function that runs on calendar changes. Optional: Create a Google Apps Script project with the code in the RoomTablets folder and deploy it as a Web App.
4. Create an Appointment Schedule for the newly created account. Configure it to look for conflicts in both the account's calendar and the room's resource calendar.
5. Repeat for all rooms/resources you want bookable.