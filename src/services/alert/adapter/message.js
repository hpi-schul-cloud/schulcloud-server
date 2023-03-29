/**
 * Unified message format
 */
class Message {
	// eslint-disable-next-line camelcase
	constructor(title, text, timestamp, page, messageId, url, status, created_at) {
		this.mTitle = title || '';
		this.mText = text || '';
		this.mTimestamp = timestamp || '1970-01-01 00:00:00';
		// Origin of Message
		this.mPage = page || '';
		this.mMessageId = messageId || '-1';
		this.mUrl = url || '';
		// eslint-disable-next-line camelcase
		this.mCreated_at = created_at || '1970-01-01 00:00:00';
		this.mStatus = status || '';
	}

	get getMessage() {
		// Unified message format
		const message = {
			title: this.mTitle,
			text: this.mText,
			status: this.mStatus,
			origin: {
				page: this.mPage,
				message_id: this.mMessageId,
			},
			timestamp: this.mTimestamp,
			url: this.mUrl,
			created_at: this.mCreated_at,
		};
		return message;
	}

	/**
	 * Set Title of Message
	 */
	set title(value) {
		this.mTitle = value;
	}

	/**
	 * Set Text of Message
	 */
	set text(value) {
		this.mText = value;
	}

	/**
	 * Set Timestamp of Message
	 */
	set timestamp(value) {
		this.mTimestamp = value;
	}

	/**
	 * Set Origin of Message
	 */
	set page(value) {
		this.mPage = value;
	}

	/**
	 * Set Id of Message
	 */
	set messageId(value) {
		this.mMessageId = value;
	}

	/**
	 * Set URL to link to
	 */
	set url(value) {
		this.mUrl = value;
	}

	/**
	 * Set Status of message
	 */
	set status(value) {
		this.mStatus = value;
	}

	/**
	 * Set Status of message
	 */
	set created_at(value) {
		this.mcreated_at = value;
	}
}

module.exports = Message;
