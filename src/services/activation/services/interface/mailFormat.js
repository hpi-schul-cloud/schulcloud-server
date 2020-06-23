/**
 * Unified Mail format
 */
class Mail {
	constructor(subject, content, receiver) {
		this.subject = subject;
		this.content = content;
		this.receiver = receiver;
	}
}

module.exports = Mail;
