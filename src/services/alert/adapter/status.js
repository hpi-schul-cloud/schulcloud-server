const Status = require('../MessageProvider/status');
const Adapter = require('./index');
const Message = require('./message');

class StatusAdapter extends Adapter {
	async getMessage(instance) {
		const data = {
			success: false,
			messages: [],
		};

		// get raw data from Message Provider
		const rawData = await Status.getData(instance);
		// transform raw data in unified message format
		if (rawData) {
			rawData.forEach((element) => {
				const message = new Message();
				message.title = element.name;
				message.text = element.message;
				message.status = element.status / 2; // map 2 -> 1 and 4 -> 2
				message.page = 'status';
				message.messageId = element.id;
				message.timestamp = element.updated_at;
				message.url = 'https://status.schul-cloud.org';
				data.messages.push(message.getMessage);
			});
			data.success = true;
		} else {
			data.success = false;
		}
		return data;
	}
}

module.exports = StatusAdapter;
