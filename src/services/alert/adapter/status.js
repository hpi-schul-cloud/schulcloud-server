const Status = require('../MessageProvider/status');
const Adapter = require('./index');
const Message = require('./message');

class StatusAdapter extends Adapter {
	async getMessage(instance) {
		const data = [];
		// get raw data from Message Provider
		const rawData = await Status.getData('brb');
		// transform raw data in unified message format
		if (rawData) {
			rawData.forEach((element) => {
				const message = new Message();
				message.title = element.name;
				message.text = element.message;
				message.page = 'status';
				message.messageId = element.id;
				message.timestamp = element.updated_at;
				data.push(message.getMessage);
			});
		}
		return data;
	}
}

module.exports = StatusAdapter;
