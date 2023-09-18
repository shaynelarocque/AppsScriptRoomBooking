var calendarId = '[Replace: Internal resource calendar]';
function doGet() {
  var html = HtmlService.createHtmlOutputFromFile("index");
  return html.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function deleteCurrentEvent(eventId) {
  var now = new Date();
  var start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours before now
  var end = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours after now

  var events = CalendarApp.getCalendarById(calendarId).getEvents(start, end);
  var event = events.find(e => e.getId() === eventId);

  if (event) { // Only delete if event exists
    event.deleteEvent();

    // Delete all existing triggers
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function deleteEvent(eventId, checkInStatus) {
  var now = new Date();
  var start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours before now
  var end = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours after now

  var events = CalendarApp.getCalendarById(calendarId).getEvents(start, end);
  var event = events.find(e => e.getId() === eventId);

  if (event && !checkInStatus[eventId]) { // Only delete if not checked in
    event.deleteEvent();

    // Delete all existing triggers
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function checkIn(eventId) {
  if (!eventId) {
    Logger.log('checkIn function called with no eventId');
    return;
  }

  var scriptProperties = PropertiesService.getScriptProperties();
  var checkInStatus = JSON.parse(scriptProperties.getProperty('checkInStatus') || '{}');
  checkInStatus[eventId] = true;
  scriptProperties.setProperty('checkInStatus', JSON.stringify(checkInStatus));

  var yellowModeEventId = scriptProperties.getProperty('yellowModeEventId');
  if (eventId == yellowModeEventId) {
    scriptProperties.deleteProperty('yellowModeEventId'); // Clear yellowModeEventId when an event is checked in
  }

  Logger.log('Checked in event: ' + eventId); // Log the checked in event ID
  Logger.log('Current checkInStatus: ' + JSON.stringify(checkInStatus)); // Log the current check-in status
  Logger.log('Current yellowModeEventId: ' + yellowModeEventId); // Log the current yellow mode event ID
}

function getCalendarStatus() {
  try {
    const now = new Date();
    const events = CalendarApp.getCalendarById(calendarId)
      .getEventsForDay(now, { max: 100 })
      .sort((a, b) => a.getStartTime() - b.getStartTime());

    let status = "Free all day";
    let freeUntil = now;
    let lastEndTime = now;
    let currentBooking = null;
    let nextBooking = null;
    let yellowMode = false;

    var scriptProperties = PropertiesService.getScriptProperties();
    var checkInStatus = JSON.parse(scriptProperties.getProperty('checkInStatus') || '{}');
    var yellowModeEventId = scriptProperties.getProperty('yellowModeEventId');

    if (events.length > 0) {
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (event.getEndTime() <= now) {
          continue;
        }

        if (event.getStartTime() <= now && event.getEndTime() > now) {
          currentBooking = event;
        } else if (!nextBooking && event.getStartTime() > now) {
          nextBooking = event;
        }

        if (event.getStartTime() > lastEndTime) {
          freeUntil = event.getStartTime();
          break;
        } else if (event.getEndTime() > lastEndTime) {
          freeUntil = event.getEndTime();
        }

        lastEndTime = event.getEndTime();
      }

      let organizerName = "Unavailable";
      let nextOrganizerName = nextBooking ? extractNameFromTitle(nextBooking) : "Unavailable";
      let currentEventId = null;

      if (nextBooking && nextBooking.getStartTime() - now <= 10 * 60 * 1000 && !checkInStatus[nextBooking.getId()]) {
        let checkInEndTime = new Date(nextBooking.getStartTime().getTime() + 10 * 60 * 1000);
        status = "Check in for " + nextOrganizerName + " before " + formatAMPM(checkInEndTime);
        yellowMode = true;
        currentEventId = nextBooking.getId(); // Set currentEventId to nextBooking's ID
      } else if (currentBooking) {
        organizerName = extractNameFromTitle(currentBooking);
        if (now - currentBooking.getStartTime() < 10 * 60 * 1000 && !checkInStatus[currentBooking.getId()]) {
          let checkInEndTime = new Date(currentBooking.getStartTime().getTime() + 10 * 60 * 1000);
          status = "Check in for " + organizerName + " before " + formatAMPM(checkInEndTime);
          yellowMode = true;
        } else if (now - currentBooking.getStartTime() >= 10 * 60 * 1000 && !checkInStatus[currentBooking.getId()]) {
          deleteEvent(currentBooking.getId(), checkInStatus);
          status = nextBooking ? "Free until " + formatAMPM(nextBooking.getStartTime()) : "Booked by " + organizerName + " at " + formatAMPM(currentBooking.getStartTime());
          yellowMode = false;
        } else {
          status = "Currently booked by " + organizerName;
          yellowMode = false;
        }
        currentEventId = currentBooking.getId(); // Set currentEventId to currentBooking's ID
      }

      return {
        status: status,
        currentEventId: currentEventId,
        nextOrganizer: nextOrganizerName,
        timeUntilNext: nextBooking ? formatAMPM(nextBooking.getStartTime()) : "Free all day",
        yellowMode: yellowMode,
        bookingEnd: currentBooking ? formatAMPM(currentBooking.getEndTime()) : null  // Add the end time of the current booking to the result object
      };
    } else {
      return {
        status: status,
        currentEventId: null,
        nextOrganizer: "Unavailable",
        timeUntilNext: "Free all day",
        yellowMode: false
      };
    }
  } catch (error) {
    console.error(error);
    return { status: "Error, check QR for availability", currentEventId: null, nextOrganizer: "Unavailable", timeUntilNext: "Free all day", yellowMode: false };
  }
}


function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

function extractNameFromTitle(event) {
  var title = event.getTitle();
  var organizerEmail = event.getCreators()[0];
  var organizerName = "Unavailable";

  if (organizerEmail == '[Replace: Booking agent email]') {
    var match = title.match(/\(([^)]+)\)/);
    if (match) {
      organizerName = match[1];
    }
  } else {
    organizerName = organizerEmail.split('@')[0];
    organizerName = organizerName.charAt(0).toUpperCase() + organizerName.slice(1);
  }

  return organizerName;
}