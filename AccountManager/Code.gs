function sendEmails() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form Responses");
    const data = sheet.getDataRange().getValues();

    var logoUrl = 'URL';
    var signupImg = 'URL';
    var signupUrl = 'URL';

    for (let i = 1; i < data.length; i++) { // Start from the second row
        const email = data[i][1];
        const firstName = data[i][2];
        const invited = data[i][7];
        const notInvited = data[i][8];
        const reason = data[i][9];
        const emailSentDate = data[i][10];

        if (!emailSentDate) { // Check if no date is set
            if (invited === true) {
                const subject = 'You\'re Invited!';
                const htmlBody = `
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
      <p>Dear ${firstName},<br> We're excited to let you know that you've been invited to join the booking platform!</p>
      <p>Please remember to follow our <a href="[Replace: URL]">space usage guidelines</a></p>
    </div>
    <div style="display: flex; width:100%;justify-content: center; align-items: center;">
    <a href="${signupUrl}"style="width: 100%;height: auto;margin-top:0.5em;margin-bottom:0.5em;display: flex;justify-content: center;">
    <img src="${signupImg}" style="display: block; margin: auto;"/>
    </a>
    </div>
  </div>
</div>`;
                const plainTextBody = `Dear ${firstName},\n\nWe're excited to let you know that you've been invited to join our Booking Platform!\n\nBook your first room now: ${signupUrl}`;
                MailApp.sendEmail({
                    to: email,
                    subject: subject,
                    body: plainTextBody,
                    htmlBody: htmlBody
                });
                sheet.getRange(i + 1, 11).setValue(new Date()); // Set date of email sent
            } else if (notInvited === true) {
                const subject = 'Regarding Your Registration';
                const htmlBody = `
        </div><div style="
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
        <p>Dear ${firstName}, your application to the Booking Platform was denied because of the reason:</p>
        <p>${reason}</p>
        <p>If you believe this is an error, please contact us at placeholder@placeholder.com.</p>
    </div>
    <div style="display: flex; width:100%;justify-content: center; align-items: center;">
    <a href="${signupUrl}"style="width: 100%;height: auto;margin-top:0.5em;margin-bottom:0.5em;display: flex;justify-content: center;">
    <img src="${signupImg}" style="display: block; margin: auto;"/>
    </a>
    </div>
  </div>
</div>`;
                const plainTextBody = `Dear ${firstName},\n\nYour booking for our platform was denied because ${reason}. If you believe this is an error, please contact us at placeholder@placeholder.com.\n`;
                MailApp.sendEmail({
                    to: email,
                    subject: subject,
                    body: plainTextBody,
                    htmlBody: htmlBody
                });
                sheet.getRange(i + 1, 11).setValue(new Date()); // Set date of email sent
            }
        }
    }
}