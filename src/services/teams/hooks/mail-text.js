const errors = require('feathers-errors');

if (process.env.SC_SHORT_TITLE === undefined)
    throw new errors.NotImplemented('process.env.SC_SHORT_TITLE is not definid');

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

module.exports = (hook, inviter) => {
    const linkData = hook.result.linkData || {};
    const user = hook.result.user || {};
    const data = hook.data;
    const team = (hook.additionalInfosTeam || {}).team || {};
    const username = (hook.params.account || {}).username;

    let opt = {
        teamName: team.name || err('Teamname'),
        shortLink: linkData.shortLink || err('Link'),
        invitee: data.role === 'teamexpert' ? data.email || user.email || err('Eingelader') : user.firstName + ' ' + user.lastName,
        inviter: inviter.firstName === undefined ? username || err('Einlader') : inviter.firstName + ' ' + inviter.lastName
    };

    if (isNewRegistration(linkData, user))
        return inviteWithRegistration(opt); // expert, new account
    else if (data.email !== undefined)      // is email invite 
        return addedToTeam(opt);            // teacher, accept needed (invite via email) 
    else
        return inviteWithEmail(opt);        // teacher, no accept needed (n21)
};

