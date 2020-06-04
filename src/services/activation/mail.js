/**
 * Unified Mail format
 */
class Mail {
	constructor(subject, content, receiver) {
		this.subject = subject;
		this.content = content;
		this.receiver = receiver;
	}

	get getMail() {
		// Unified message format
		const mail = {
			subject: this.subject,
			content: this.content,
			email: this.receiver,
		};
		return mail;
	}
}

module.exports = Mail;
