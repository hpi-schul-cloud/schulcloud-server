const { Configuration } = require('@hpi-schul-cloud/commons');
const Status = require('../MessageProvider/status');
const Adapter = require('./index');
const Message = require('./message');

class StatusAdapter extends Adapter {
	async getMessage(instance) {
		const data = {
			success: false,
			messages: [],
		};

		const getStatus = (number) => {
			switch (number) {
				case 2:
					return 'danger';
				case 4:
					return 'done';
				default:
					return 'info';
			}
		};

		// get raw data from Message Provider
		const rawData = await Status.getData(instance);
		// transform raw data in unified message format
		if (rawData) {
			rawData.forEach((element) => {
				const message = new Message();
				message.title = element.name;
				message.text = element.message;
				message.status = getStatus(element.status);
				message.page = 'status';
				message.messageId = element.id;
				message.timestamp = element.updated_at;
				message.url = Configuration.get('ALERT_STATUS_URL');
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
