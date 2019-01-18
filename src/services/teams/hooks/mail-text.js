const { warn } = require('../../../logger/index');

if (process.env.SC_SHORT_TITLE === undefined)
    warn('process.env.SC_SHORT_TITLE is not defined');

const cloudTitle = process.env.SC_SHORT_TITLE;

const close = `\n\nViel Spaß und einen guten Start wünscht dir dein
${cloudTitle}-Team`;

const err = (str) => {
    return `[Fehler: ${str}]`;
};

const inviteWithRegistration = ({ invitee, inviter, teamName, shortLink }) => {
    return `Hallo ${invitee}!
\nDu wurdest von ${inviter} eingeladen, dem Team '${teamName}' der ${cloudTitle} beizutreten.
Da du noch keinen ${cloudTitle} Account besitzt, folge bitte diesem Link, um die Registrierung abzuschließen und dem Team beizutreten: ${shortLink}${close}`;
};

const inviteWithEmail = ({ invitee, inviter, teamName, shortLink }) => {
    return `Hallo ${invitee}!
\nDu wurdest von ${inviter} zu dem Team '${teamName}' der ${cloudTitle} hinzugefügt.
Klicke auf diesen Link, um deine Teams aufzurufen: ${shortLink}${close}`;
};

const addedToTeam = ({ invitee, inviter, teamName, shortLink }) => {
    return `Hallo ${invitee}!
\nDu wurdest von ${inviter} eingeladen, dem Team '${teamName}' der ${cloudTitle} beizutreten.
Klicke auf diesen Link, um die Einladung anzunehmen: ${shortLink}${close}`;
};

const isNewRegistration = (linkData, user) => {
    const link = linkData.link || linkData.target || '';
    return link.includes('/byexpert/?importHash=' + (user.importHash || linkData.hash));
};

const getName = (user = {}) => {
    return user.firstName + ' ' + user.lastName;
};

const getEmail = ({ email, user, usernameInviter }) => {
    return email || (user || {}).email || usernameInviter || err('Eingeladener');
};

const getTeamName = (team) => {
    return team.name || err('Teamname');
};

const getShortLink = (linkData = {}) => {
    return linkData.shortLink || err('Link');
};



module.exports = (hook, inviter) => {
    const { isResend, isUserCreated, email, linkData, user } = hook.result || {};
    const team = (hook.additionalInfosTeam || {}).team || {};
    const usernameInviter = (hook.params.account || {}).username;

    let opt = {
        teamName: getTeamName(team),
        shortLink: getShortLink(linkData),
        invitee: isUserCreated || isResend ? getEmail({ email, user }) : getName(user), //todo discuss maybe better to make it clear with email invite use email
        inviter: inviter.firstName === undefined ? getEmail({ usernameInviter }) : getName(inviter)
    };

    if (isNewRegistration(linkData, user))
        return inviteWithRegistration(opt); // expert, new account
    else if (email !== undefined)           // is email invite 
        return addedToTeam(opt);            // teacher, accept needed (invite via email) 
    else
        return inviteWithEmail(opt);        // teacher, no accept needed (n21)
};

