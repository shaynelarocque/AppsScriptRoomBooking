# WIP
# Why it exists

No booking platform fit our use case perfectly and provided an acceptable amount of features for the price they demanded ($50/room per month? $3 per user per month?) We needed a solution that provided unlimited user accounts due to our constant flow of startup founders that also integrated well with Google Calendar resources, so our internal employees could continue to book rooms through Google Calendar without fear of double booking, while not being confusing to interact with.
# Butlers

## Accounts
- A Google Workspace account is created for each room we want to be bookable. The naming scheme is d3butler_roomname@district3.co. These accounts have “Make changes to events” permissions granted to them for their respective room’s resource calendar.

## Appointment Schedule

- Within each account, a Google Appointment Schedule is created that will be used for the platform users to book time slots in the accounts calendar. The Appointment Schedule has a few changes made to it to ensure a consistent experience.
    - Under “Calendars checked for availability” the Appointment Schedule must look for conflicts in both the accounts calendar as well as the room Resource Calendar. To enable this, the calendar must be enabled on the account.
# Tablet Displays

This project consists of three components: the JavaScript (Google Apps Script), the HTML (webpage structure and styling), and the iframe (embedded HTML document hosted on a website).
