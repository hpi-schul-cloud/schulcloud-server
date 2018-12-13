const errors = require('feathers-errors');

if (process.env.SC_SHORT_TITLE === undefined)
    throw new errors.NotImplemented('process.env.SC_SHORT_TITLE is not definid');

const cloudTitle = process.env.SC_SHORT_TITLE;

const close = `\nViel Spaß und einen guten Start wünscht dir dein
${cloudTitle}-Team`;

const inviteWithRegistration = ({ invitee, inviter, teamName, shortLink }) => {
    return `Hallo ${invitee}!
\nDu wurdest von ${inviter} eingeladen, dem Team '${teamName}' der ${cloudTitle} beizutreten.
Da du noch keinen ${cloudTitle} Account besitzt, folge bitte diesem Link, um die Registrierung abzuschließen und dem Team beizutreten: ${shortLink}
${close}`;
};

const inviteWithEmail = ({ invitee, inviter, teamName, shortLink }) => {
    return `Hallo ${invitee}!
\nDu wurdest von ${inviter} zu dem Team '${teamName}' der ${cloudTitle} hinzugefügt.
Klicke auf diesen Link, um deine Teams aufzurufen: ${shortLink}
${close}`;
};

const addedToTeam = ({ invitee, inviter, teamName, shortLink }) => {
    return `Hallo ${invitee}!
\nDu wurdest von ${inviter} eingeladen, dem Team '${teamName}' der ${cloudTitle} beizutreten.
Klicke auf diesen Link, um die Einladung anzunehmen: ${shortLink}
${close}`;
};

const err = (str) => {
    return `[Fehler: ${str}]`;
};

module.exports = (hook, inviter) => {
    const linkData = hook.result.linkData || {};
    const user = hook.result.user || {};
    const data = hook.data;
    const team = (hook.additionalInfosTeam || {}).team || {};
    const username = (hook.params.account || {}).username;

    const isNewRegistration = (linkData.link || []).includes('/registration/');
    const isNot_newExperte = user.firstName !== 'Experte';
    const isNot_emailInvite = data.email !== undefined;

    let opt = {
        teamName: team.name || err('Teamname'),
        shortLink: linkData.shortLink || err('Link'),
        invitee: isNot_newExperte ? user.firstName + ' ' + user.lastName : data.email || user.email || err('Eingelader'),
        inviter: inviter.firstName !== undefined ? inviter.firstName + ' ' + inviter.lastName : username || err('Einlader')
    };

    if (isNewRegistration)
        return inviteWithRegistration(opt); // expert, new account
    else if (isNot_emailInvite)
        return addedToTeam(opt);            // teacher, accept needed (invite via email) 
    else
        return inviteWithEmail(opt);        // teacher, no accept needed (n21)
};

