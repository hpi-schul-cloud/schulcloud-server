class MockEmailService {
	constructor(eventHandler) {
		this.eventHandler = eventHandler;
	}

	create({ subject, content }, params) {
		this.eventHandler({ subject, content, params });
		return Promise.resolve();
	}
}

module.exports = {
	MockEmailService,
};
