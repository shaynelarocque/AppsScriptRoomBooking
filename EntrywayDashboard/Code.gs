function doGet() {
  var html = HtmlService.createHtmlOutputFromFile("Index");
  return html.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getTime() {
  var now = new Date();
  return now;
}

function getAvailableRooms() {
  var rooms = [
    { name: 'Room1', calendarId: 'Resource URL' },
    { name: 'Room2', calendarId: 'Resource URL' },
    { name: 'Room3', calendarId: 'Resource URL' },
    { name: 'Room4', calendarId: 'Resource URL' },
    { name: 'Room5', calendarId: 'Resource URL' },
  ];

  var currentTime = new Date();
  var currentTimeStr = currentTime.toISOString();
  Logger.log("Current time: " + currentTimeStr);

  var endTime = new Date(currentTime);
  endTime.setHours(endTime.getHours() + 1); // Add 1 hour to current time
  Logger.log("End time: " + endTime.toISOString());

  var availableRooms = [];

  for (var i = 0; i < rooms.length; i++) {
    Logger.log("Checking room: " + rooms[i].name);

    var calendar = CalendarApp.getCalendarById(rooms[i].calendarId);
    var events = calendar.getEvents(currentTime, endTime);
    Logger.log("Number of events for this room: " + events.length);

    var isRoomAvailable = true;

    for (var j = 0; j < events.length; j++) {
      var eventStart = events[j].getStartTime();
      var eventEnd = events[j].getEndTime();
      Logger.log("Event start time: " + eventStart);
      Logger.log("Event end time: " + eventEnd);

      if (currentTime >= eventStart && currentTime < eventEnd) {
        Logger.log("Room is booked during this time");
        isRoomAvailable = false;
        break;
      }
    }

    if (isRoomAvailable) {
      Logger.log("Room is available");
      availableRooms.push(rooms[i].name);
    }
  }

  if (availableRooms.length === 0) {
    Logger.log("All rooms are booked");
    return ["All booked"];
  }

  Logger.log("Available rooms: " + availableRooms.join(", "));
  return availableRooms;
}

function getRandomStartup() {
  var url = 'JSON URL';
  var response = UrlFetchApp.fetch(url);
  var data = JSON.parse(response.getContentText());
  var randomStartup;
  var randomIndex;

  do {
    randomIndex = Math.floor(Math.random() * data.length);
    randomStartup = data[randomIndex];
  } while (!randomStartup['project-title'] || !randomStartup['company-website'] || !randomStartup['co-founders-first-name-globiflow']);
  Logger.log("Selected startup object: " + JSON.stringify(randomStartup)); // log the selected startup object
  return randomStartup;
}

function getEventsCalendar() {
  var calendarId = 'Events Calendar URL';

  var now = new Date();
  now.setHours(0, 0, 0, 0); // Set the time to the start of today
  Logger.log("Now: " + now);

  var next5Days = new Date();
  next5Days.setDate(next5Days.getDate() + 5);
  next5Days.setHours(0, 0, 0, 0); // Set the time to the start of the day after 5 days
  Logger.log("Next 5 days: " + next5Days);

  var calendar = CalendarApp.getCalendarById(calendarId);
  var events = calendar.getEvents(now, next5Days);
  Logger.log("Number of events: " + events.length);

  var eventData = events.map(function (event) {
    return {
      'title': event.getTitle(),
      'start': event.getStartTime(),
      'end': event.getEndTime(),
      'description': event.getDescription()
    };
  });

  // Filter out events that do not occur within the next 5 days
  eventData = eventData.filter(function (event) {
    var eventStart = new Date(event.start);
    eventStart.setHours(0, 0, 0, 0); // Set the time to the start of the event day
    return eventStart >= now && eventStart <= next5Days;
  });

  if (eventData.length === 0) {
    return [];
  }
  Logger.log("Returning event data: " + JSON.stringify(eventData));
  return JSON.stringify(eventData);
}


function getMarqueeText() {
  var ss = SpreadsheetApp.openByUrl('Spreadsheet URL');
  var sheet = ss.getSheetByName('Bookings');
  return sheet.getRange('T2').getValue();
}