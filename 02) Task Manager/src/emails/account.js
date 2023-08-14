const mailgun = require('mailgun-js');
const domainName = 'sandboxfedf17bdb7f548959a3657476aa794f7.mailgun.org';
const mailgunAPIKey = '5f80ae7af6e354ed3feb0f3e8fb46174-1d8af1f4-0c352f76';

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.DOMAIN_NAME,
});

/*
! Here in this email section I'm using a service called mailgun which only allows sending emails to specific verified emails for the testing plan and currently my main email is the only verified one.
 */

// welcome user
const welcomeEmail = (email, name) => {
  mg.messages().send(
    {
      from: 'Durgesh <48durgesh.kumar@gmail.com>',
      to: email,
      subject: 'Thanks for joining me.',
      text: `Hello ${name}! Thanks for being part of my projects. Glad to have you here.`,
    },
    function (error, body) {
      console.log(body);
    }
  );
};

// deleting user email
const cancelationEmail = (email, name) => {
  mg.messages().send(
    {
      from: 'Durgesh <48durgesh.kumar@gmail.com>',
      to: email,
      subject: 'Sad to see you leave :/',
      text: `Goodbye ${name}! We're sorry to see you leave. Could you share some feedback so we can improve ourselves.`,
    },
    function (error, body) {
      console.log(body);
    }
  );
};

module.exports = {
  welcomeEmail,
  cancelationEmail,
};
