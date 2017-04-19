const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../src/app');

chai.use(chaiHttp);

exports.authenticate = request => ({username, password}) => (new Promise((resolve, reject) => {
	chai.request(app)
		.post('/authentication')
		.set('Accept', 'application/json')
		.set('content-type', 'application/x-www-form-urlencoded')
		//send credentials
		.send({username, password})
		.end((err, res) => {
			if (err) {
				reject(err);
				return;
			}
			const r = request
				.set('Authorization', res.body.accessToken);
			resolve(r);
		});
}));
