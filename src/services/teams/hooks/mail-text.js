const { SC_SHORT_TITLE } = require('../../../../config/globals');

const close = `\n\nViel Spaß und einen guten Start wünscht dir dein ${SC_SHORT_TITLE}-Team`;

const inviteWithRegistration = ({ invitee, inviter, teamName, shortLink }) => `Hallo ${invitee}!
\nDu wurdest von ${inviter} eingeladen, dem Team '${teamName}' der ${SC_SHORT_TITLE} beizutreten.
Da du noch keinen ${SC_SHORT_TITLE} Account besitzt, folge bitte diesem Link,
um die Registrierung abzuschließen und dem Team beizutreten: ${shortLink}${close}`;

const inviteWithEmail = ({ invitee, inviter, teamName, shortLink }) => `Hallo ${invitee}!
\nDu wurdest von ${inviter} zu dem Team '${teamName}' der ${SC_SHORT_TITLE} hinzugefügt.
Klicke auf diesen Link, um deine Teams aufzurufen: ${shortLink}${close}`;

const addedToTeam = ({ invitee, inviter, teamName, shortLink }) => `Hallo ${invitee}!
\nDu wurdest von ${inviter} eingeladen, dem Team '${teamName}' der ${SC_SHORT_TITLE} beizutreten.
Klicke auf diesen Link, um die Einladung anzunehmen: ${shortLink}${close}`;

const isNewRegistration = (linkData, user) => {
	const link = linkData.link || linkData.target || '';
	return link.includes(`?importHash=${user.importHash || linkData.hash}`);
};

const err = (str) => `[Fehler: ${str}]`;
const getName = (user = {}) => `${user.firstName} ${user.lastName}`;
const getEmail = ({ email, user, usernameInviter }) =>
	email || (user || {}).email || usernameInviter || err('Eingeladener');
const getTeamName = (team) => team.name || err('Teamname');
const getShortLink = (linkData = {}) => linkData.shortLink || err('Link');

module.exports = (hook, inviter) => {
	const { isResend, isUserCreated, email, linkData, user } = hook.result || {};
	const team = (hook.additionalInfosTeam || {}).team || {};
	const usernameInviter = (hook.params.account || {}).username;

	const opt = {
		teamName: getTeamName(team),
		shortLink: getShortLink(linkData),
		invitee: isUserCreated || isResend ? getEmail({ email, user }) : getName(user),
		inviter: inviter.firstName === undefined ? getEmail({ usernameInviter }) : getName(inviter),
	};
	// todo discuss invitee maybe better to make it clear with email invite use email
	let text;
	if (isNewRegistration(linkData, user)) {
		text = inviteWithRegistration(opt); // expert, new account
	} else if (email !== undefined) {
		// is email invite
		text = addedToTeam(opt); // teacher, accept needed (invite via email)
	} else {
		text = inviteWithEmail(opt); // teacher, no accept needed (n21)
	}
	return text;
};
