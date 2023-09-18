// Configuration
var config = {
  primaryCalId: "[Replace: Internal resource calendar here]", //primary resource calendar
  secondaryCalId: "[Replace: Public agent's calendar here]", //secondary butler calendar
  sheetId: '[Replace: Google sheet for checking permissions here]' // Google Sheet ID
}
function main() {
  console.log("Main function started");
  processEvents(config.secondaryCalId);
  invitePrimaryToSecondary(config.primaryCalId, config.secondaryCalId);
  syncSecondaryWithBookings();
  console.log("Main function completed");
}

function processEvents(calendarId) {
  deleteEventsIfNotAllowed(calendarId);
  deleteEventsIfGuestDeclined(calendarId);
}

function checkDailyQuota(email, date) {
  var sheet = SpreadsheetApp.openById(config.sheetId).getSheetByName('Bookings');
  var bookings = sheet.getRange('A2:D' + sheet.getLastRow()).getValues();

  var count = 0;
  for (var i = 0; i < bookings.length; i++) {
    var booking = bookings[i];
    if (booking[0] === email && sameDay(new Date(booking[1]), date)) {
      count++;
    }
  }

  return count < 2;
}

function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function syncSecondaryWithBookings() {
  var secondaryCal = CalendarApp.getCalendarById(config.secondaryCalId);
  var now = new Date();
  var sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  var events = secondaryCal.getEvents(now, sevenDaysFromNow);

  var sheet = SpreadsheetApp.openById(config.sheetId).getSheetByName('Bookings');
  var bookings = sheet.getRange('A2:E' + sheet.getLastRow()).getValues(); // Adjusted to include column E

  var eventIds = events.map(event => event.getId());
  var bookingIds = bookings.map(booking => booking[3]);

  // Add new bookings
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    if (bookingIds.indexOf(event.getId()) === -1) {
      var guests = event.getGuestList().map(guest => guest.getEmail());
      var bookerEmail = guests.find(email => !email.endsWith('@[Replace: Internal user domain]') && !email.endsWith('@google.com') && !email.endsWith('@resource.calendar.google.com'));
      if (checkDailyQuota(bookerEmail, event.getStartTime(), config.secondaryCalId)) {
        sheet.appendRow([bookerEmail, event.getStartTime(), event.getEndTime(), event.getId(), config.secondaryCalId]);
      } else {
        // Delete the event from the secondary calendar
        event.deleteEvent();
        // Send an email to the user to inform them that their daily quota is reached
        sendDenialEmail(bookerEmail, event.getTitle(), "you have reached your daily quota of <strong>2 hours</strong>", event.getStartTime());
      }
    }
  }

  // Delete removed bookings
  for (var i = 0; i < bookings.length; i++) {
    var booking = bookings[i];
    if (eventIds.indexOf(booking[3]) === -1 && new Date(booking[1]).getTime() > now.getTime() && booking[4] === config.secondaryCalId) {
      sheet.deleteRow(i + 2); // +2 because arrays are 0-indexed and the first row is the header
    }
  }
}

function invitePrimaryToSecondary(primaryId, secondaryId) {
  var today = new Date();
  var enddate = new Date();
  enddate.setDate(today.getDate() + 7);

  var secondaryCal = CalendarApp.getCalendarById(secondaryId);
  var secondaryEvents = secondaryCal.getEvents(today, enddate);

  var evi;
  for (sev in secondaryEvents) {
    evi = secondaryEvents[sev];
    console.log("Processing secondary event");

    var guests = evi.getGuestList().map(guest => guest.getEmail()); // get list of guest emails for the event

    if (guests.indexOf(primaryId) === -1) { // if primary calendar is not already invited
      evi.addGuest(primaryId);
      console.log("Invited primary calendar to the event");
    }
    else {
      console.log("Primary calendar already invited to the event");
    }
  }
}

function deleteEventsIfNotAllowed(calendarId) {
  var calendar = CalendarApp.getCalendarById(calendarId);
  var now = new Date();
  var sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  var events = calendar.getEvents(now, sevenDaysFromNow);

  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    var description = event.getDescription();
    var emailMatch = description.match(/[\w.+-]+@[a-z\d-]+(\.[a-z\d-]+)*\.[a-z]+/gi); // regex to find email in description

    if (emailMatch) {
      var email = emailMatch[0]; // assuming the first found email is the correct one

      if (!isEmailAllowed(email)) {
        var startTime = event.getStartTime();
        if (startTime instanceof Date) {
          sendDenialEmail(email, event.getTitle(), "you are not an approved user", startTime);
        } else {
          console.error("Invalid start time for event: " + event.getId());
        }
        event.deleteEvent();
      }
    }
  }
}

function deleteEventsIfGuestDeclined(calendarId) {
  var calendar = CalendarApp.getCalendarById(calendarId);
  var now = new Date();
  var sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  var events = calendar.getEvents(now, sevenDaysFromNow);

  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    var guests = event.getGuestList();
    var creator = event.getCreators()[0]; // Get the creator of the event

    for (var j = 0; j < guests.length; j++) {
      var guest = guests[j];

      if ((guest.getEmail() === creator && guest.getGuestStatus() == CalendarApp.GuestStatus.NO) || // If the owner declined the event
        (guest.getGuestStatus() == CalendarApp.GuestStatus.NO)) { // If any guest declined the event
        event.deleteEvent();
        break;
      }
    }
  }
}

function isEmailAllowed(email) {
  var sheetId = config.sheetId; // Google Sheet ID
  var sheet = SpreadsheetApp.openById(sheetId).getSheetByName('Form Responses'); // sheet name

  var emailColumn = sheet.getRange('B:B').getValues(); // emails are in column B
  var statusColumn = sheet.getRange('H:H').getValues(); // status is in column H

  var lowerCaseEmail = email.toLowerCase(); // converts to lowercase because it is case sensitive

  for (var i = 0; i < emailColumn.length; i++) {
    if (emailColumn[i][0].toLowerCase() === lowerCaseEmail && statusColumn[i][0] === true) {
      return true;
    }
  }

  return false;
}

function sendDenialEmail(email, eventName, reason, eventStartTime) {
  var subject = 'Notice: Your D3 Booking Was Cancelled';

  var logoUrl = '[Replace: Logo url]';
  var signupImg = '[Replace: Sign up button img url]';
  var signupUrl = '[Replace: Sign up url]';

  // Format the event start time
  var formattedStartTime = Utilities.formatDate(eventStartTime, "America/Toronto", "EEEE, MMMM d 'at' h a");

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: "Your booking for " + eventName + " on " + formattedStartTime + " was cancelled because " + reason + ". Need more help? Contact us at spaceteam@district3.co.",
    htmlBody: `
<div style="
display: flex; 
justify-content: center; 
align-items: center; 
height: auto;
border:2px solid black;
border-radius:0.4em;
background-color: #FFF8DC;
max-width:600px;">
  <div style="
  font-family: Arial, sans-serif;
  width:100%;">
<img src="${logoUrl}" alt="Logo" style="
display: block;
margin-left: auto;
border-top-left-radius:0.25em;
border-top-right-radius:0.25em;
margin-right: auto;
width: 100%;
border-bottom:2px solid black;"><br>
    <div style="
    text-align:center;
    margin:20px;">
      <p>Your booking for <strong>${eventName}</strong> on <strong>${formattedStartTime}</strong> was cancelled because ${reason}.</p>
      <p>Need more help? Contact us at spaceteam@district3.co.</p>
    </div>
    <div style="display: flex; width:100%;justify-content: center; align-items: center;">
    <a href="${signupUrl}"style="width: 100%;height: auto;margin-top:0.5em;margin-bottom:0.5em;display: flex;justify-content: center;">
    <img src="${signupImg}" style="display: block; margin: auto;"/>
    </a>
    </div>
  </div>
</div>
  `,
    isHtml: true
  });
}