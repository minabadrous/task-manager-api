const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMessage = ({ name, email }) => {
    const welcomeMessage = {
        to: email,
        from: "minabadrous.vu@gmail.com",
        subject: "Thanks for joining in!",
        text: `Welcome to the app, ${name}. Enjoy it!`,
    };

    sgMail.send(welcomeMessage).catch((error) => {
        console.error(error);
    });
};

const sendByeMessage = ({ name, email }) => {
    const byeMessage = {
        to: email,
        from: "minabadrous.vu@gmail.com",
        subject: "Sad to see you go :(",
        text: `We're sad that you're leaving us, ${name}. Enjoy it!`,
    };

    sgMail.send(byeMessage).catch((error) => {
        console.error(error);
    });
};

module.exports = {
    sendWelcomeMessage,
    sendByeMessage,
};
