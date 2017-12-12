const redis = require("redis");
const crypto = require("crypto");

function generateKey(cb) {
	crypto.randomBytes(16, function(err, buffer) {
		cb(buffer.toString('hex'));
	});
}

const expiry = (60 * 60 * 12); //12 hours

const required = ["toolId", "userId"];

class FeedbackService {
	constructor(opts) {
		this.options = opts;
		this.client  = null;
		this.ready   = false;
	}

	setup(app, path) {
		const inst = app.get("redis");

		if(!inst) {
			app.set("redis", redis.createClient("redis://redis", this.options));
		}

		this.client = app.get("redis");
	}

	get(id, params) {
		return new Promise((resolve, reject) => {
			this.client.get("token-" + id, (err, reply) => {
				if(err) reject(err);

				resolve({
					token: JSON.parse(reply || {})
				});
			});
		})
	}

	create(data, params) {
		return new Promise((resolve, reject) => {
			if(!required.every(el => data.hasOwnProperty(el)))
				reject();

			generateKey((rand) => {
				const key = "token-" + rand;
				const userId = data.userId;
				const toolId = data.toolId;

				this.client.SETEX(key, expiry, JSON.stringify({
					userId: userId,
					toolId: toolId
				}), (err, reply) => {
					if(err) reject(err);

					resolve({
						feedback_key: rand
					});
				});
			});
		});
	}
}

function service(options) {
	return new FeedbackService(options);
}

module.exports = service;
