/**
 * Unified message format
 */
class Message {
	constructor(_title, _text, _timestamp, _page, _messageId) {
		this.m_title = _title || '';
		this.m_text = _text || '';
		this.m_timestamp = _timestamp || '1970-01-01 00:00:00';
		// Origin of Message
		this.m_page = _page || '';
		this.m_messageId = _messageId || '-1';
	}

	get getMessage() {
		// Unified message format
		const message = {
			title: this.m_title,
			text: this.m_text,
			origin: {
				page: this.m_page,
				message_id: this.m_messageId,
			},
			timestamp: this.m_timestamp,
		};
		return message;
	}

	/**
     * Set Title of Message
     */
	set title(value) {
		this.m_title = value;
	}

	/**
     * Set Text of Message
     */
	set text(value) {
		this.m_text = value;
	}

	/**
     * Set Timestamp of Message
     */
	set timestamp(value) {
		this.m_timestamp = value;
	}

	/**
     * Set Origin of Message
     */
	set page(value) {
		this.m_page = value;
	}

	/**
     * Set Id of Message
     */
	set messageId(value) {
		this.m_messageId = value;
	}
}

module.exports = Message;
