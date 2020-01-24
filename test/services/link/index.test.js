/* eslint-disable func-names */
const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../src/app');

chai.use(chaiHttp);

const subtractDays = (date, d) => {
	// generate a date object that is d days before now
	// calculation method intentionally different from what is being used in production
	date.setTime(date.getTime() - (d * 24 * 60 * 60 * 1000));
	return date;
};

describe('link service', () => {
	const service = app.service('link');
	// forces disables duplicate prevention during tests to prevent conflicts with existing data
	const forceNew = true;
	it('registered the links service', () => {
		assert.ok(service);
	});

	it(`generates a link of length ${service.Model.linkLength} that has the correct target set`, function () {
		this.timeout(10000);

		const url = 'https://schul-cloud.org/';
		return service.create({ target: url, forceNew })
			.then((data) => {
				chai.expect(data.id).to.have.lengthOf(service.Model.linkLength);
				chai.expect(data.target).to.equal(url);
				return Promise.resolve(data.id);
			})
			.then((id) => new Promise((resolve, reject) => {
				chai.request(app)
					.get(`/link/${id}`)
					.end((error, result) => {
						if (error) return reject(error);
						chai.expect(result.status).to.equal(200);
						chai.expect(result.body).to.include.keys('target');
						return resolve();
					});
			}));
	});

	it('generates a valid link from 29 days ago', function () {
		this.timeout(10000);
		const createdAt = subtractDays(new Date(), 29);

		const url = 'http://localhost:3100/registration/';
		return service.create({ target: url, createdAt, forceNew })
			.then((data) => {
				chai.expect(data.id).to.have.lengthOf(service.Model.linkLength);
				chai.expect(data.target).to.equal(url);
				return Promise.resolve(data.id);
			})
			.then((id) => new Promise((resolve, reject) => {
				chai.request(app)
					.get(`/link/${id}`)
					.end((error, result) => {
						if (error) return reject(error);
						chai.expect(result.status).to.equal(200);
						chai.expect(result.body).to.include.keys('target');
						return resolve();
					});
			}));
	});

	it('generates an expired link from 31 days ago', function () {
		this.timeout(10000);
		const createdAt = subtractDays(new Date(), 31);

		const url = 'http://localhost:3100/registration/';
		return service.create({ target: url, createdAt, forceNew })
			.then((data) => {
				chai.expect(data.id).to.have.lengthOf(service.Model.linkLength);
				chai.expect(data.target).to.equal(url);
				return Promise.resolve(data.id);
			})
			.then((id) => new Promise((resolve, reject) => {
				chai.request(app)
					.get(`/link/${id}`)
					.end((error, result) => {
						if (error) return reject(error);
						chai.expect(result.status).to.equal(403);
						chai.expect(result.body).to.not.include.keys('target');
						return resolve();
					});
			}));
	});

	it('generates an external link from 29 days ago', function () {
		this.timeout(10000);
		const createdAt = subtractDays(new Date(), 29);

		const url = 'https://google.de/registration/';
		return service.create({ target: url, createdAt, forceNew })
			.then((data) => {
				chai.expect(data.id).to.have.lengthOf(service.Model.linkLength);
				chai.expect(data.target).to.equal(url);
				return Promise.resolve(data.id);
			})
			.then((id) => new Promise((resolve, reject) => {
				chai.request(app)
					.get(`/link/${id}`)
					.end((error, result) => {
						if (error) return reject(error);
						chai.expect(result.status).to.equal(200);
						chai.expect(result.body).to.include.keys('target');
						return resolve();
					});
			}));
	});

	it('generates an external link from 31 days ago', function () {
		this.timeout(10000);
		const createdAt = subtractDays(new Date(), 31);

		const url = 'https://google.de/registration/';
		return service.create({ target: url, createdAt, forceNew })
			.then((data) => {
				chai.expect(data.id).to.have.lengthOf(service.Model.linkLength);
				chai.expect(data.target).to.equal(url);
				return Promise.resolve(data.id);
			})
			.then((id) => new Promise((resolve, reject) => {
				chai.request(app)
					.get(`/link/${id}`)
					.end((error, result) => {
						if (error) return reject(error);
						chai.expect(result.status).to.equal(200);
						chai.expect(result.body).to.include.keys('target');
						return resolve();
					});
			}));
	});

	it('generates a valid link two days in the future', function () {
		this.timeout(10000);
		const createdAt = subtractDays(new Date(), -2);

		const url = 'http://localhost:3100/registration/';
		return service.create({ target: url, createdAt, forceNew })
			.then((data) => {
				chai.expect(data.id).to.have.lengthOf(service.Model.linkLength);
				chai.expect(data.target).to.equal(url);
				return Promise.resolve(data.id);
			})
			.then((id) => new Promise((resolve, reject) => {
				chai.request(app)
					.get(`/link/${id}`)
					.end((error, result) => {
						if (error) return reject(error);
						chai.expect(result.status).to.equal(200);
						chai.expect(result.body).to.include.keys('target');
						return resolve();
					});
			}));
	});

	it('generates a valid link from now', function () {
		this.timeout(10000);
		const createdAt = new Date();

		const url = 'http://localhost:3100/registration/';
		return service.create({ target: url, createdAt, forceNew })
			.then((data) => {
				chai.expect(data.id).to.have.lengthOf(service.Model.linkLength);
				chai.expect(data.target).to.equal(url);
				return Promise.resolve(data.id);
			})
			.then((id) => new Promise((resolve, reject) => {
				chai.request(app)
					.get(`/link/${id}`)
					.end((error, result) => {
						if (error) return reject(error);
						chai.expect(result.status).to.equal(200);
						chai.expect(result.body).to.include.keys('target');
						return resolve();
					});
			}));
	});

	it('generate two links with same target', function () {
		this.timeout(10000);
		const createdAt = new Date();

		const url = 'http://localhost:3100/testurl/1234';
		return service.create({ target: url, createdAt })
			.then((data) => {
				chai.expect(data.id).to.have.lengthOf(service.Model.linkLength);
				chai.expect(data.target).to.equal(url);
				return Promise.resolve(data.id);
			})
			.then((id) => new Promise((resolve) => {
				service.create({ target: url, createdAt })
					.then((data) => {
						// check that shortlinks are the same
						chai.expect(data.id).to.have.lengthOf(service.Model.linkLength);
						chai.expect(data.id).to.equal(id);
						return resolve();
					});
			}));
	});
});
