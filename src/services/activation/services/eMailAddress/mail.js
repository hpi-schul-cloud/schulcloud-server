/* eslint-disable max-len */

const { SC_SHORT_TITLE } = require('../../../../../config/globals');
const MailInterface = require('../interface/mail');
const Mail = require('../interface/mailFormat');

class StatusAdapter extends MailInterface {
	async getActivationCodeMail(payload = {}) {
		if (!payload.user) throw new SyntaxError('Payload missing user object');
		if (!payload.activationLink) throw new SyntaxError('Payload missing user object');
		if (!payload.receiver) throw new SyntaxError('Payload missing user object');
		const { user, activationLink, receiver } = payload;

		const subject = 'Bestätige deine E-Mail-Adresse';
		const content = {
			text: `Bestätige deine E-Mail-Adresse
\\nHallo ${user.firstName},
\\nbitte bestätige deine neue E-Mail-Adresse über folgenden Link: ${activationLink}
\\nDein ${SC_SHORT_TITLE} Team`,
			html: '',
		};

		return new Mail(subject, content, receiver).getMail;
	}

	async getFYIMail(payload = {}) {
		if (!payload.user) throw new SyntaxError('Payload missing user object');
		const { user } = payload;

		const subject = 'E-Mail-Adresse geändert';
		const content = {
			text: `E-Mail-Adresse geändert
		\\nHallo ${user.firstName},
		\\nwir wollten dich nur informieren, dass sich die E-Mail-Adresse für dein ${SC_SHORT_TITLE} Konto geändert hat.
		\\nWenn du die Änderung veranlasst hast, ist alles in Ordnung.
		\\nFalls du nicht darum gebeten hast, deine E-Mail-Adresse zu änderen, kontaktiere deinen Schuladministrator oder unseren User-Support.
		\\nDein ${SC_SHORT_TITLE} Team`,
			html: '',
		};

		return new Mail(subject, content, user.email).getMail;
	}
}

module.exports = StatusAdapter;
