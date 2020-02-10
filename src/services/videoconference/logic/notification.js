const sendEmailNotification = (app, emailAdresses, bbbUrl) => {
    const mailService = app.service('/mails');
    if (emailAdresses.length < 1) {
        console.error('No emails found');
        return;
    }
    if (!bbbUrl) {
        console.error('No meeting URL provided')
        return;
    }

    const subject = `You've been invited to a meeting!`
    const content = `You've been invited to a meeting powered by Big Blue Button! Click the link to attend: ${bbbUrl}`

    const waits = emailAdresses.map((address) => mailService
        .create({ address, subject, content })
        .then((res) => res.accepted[0])
        .catch((err) => `Error: ${err.message}`));

    return Promise.all(waits)
        .then((values) => values)
        .catch((err) => err);
}
module.exports = { sendEmailNotification }
