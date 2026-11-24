const { expect } = require('chai');
const { AxiosError } = require('axios');
const { ObjectId } = require('bson');
const MESSAGE = Symbol.for('message');

const { SecretRegistry } = require('../../dist/apps/server/infra/configuration/secret-registry');
const { SecretRegistry: registryFromFacade } = require('../../dist/apps/server/infra/configuration');
const { getProductionFormat, getDevelopFormat, getTestFormat, maskSensitiveData } = require('../../src/logger/utils');

const SECRET = 'my+secret/value="1"';

const toJsonLine = (info) => JSON.parse(getProductionFormat().transform({ level: 'info', ...info })[MESSAGE]);

describe('[logger] masking in the feathers logger', () => {
	let savedSecrets;

	beforeEach(() => {
		// Other tests in the same mocha process may have registered secrets, they are restored afterwards.
		savedSecrets = [...SecretRegistry.getSecrets()];
		SecretRegistry.register(SECRET);
	});

	afterEach(() => {
		SecretRegistry.clear();
		savedSecrets.forEach((secret) => SecretRegistry.register(secret));
	});

	it('should use the SecretRegistry the compiled Nest code fills', () => {
		expect(registryFromFacade).to.equal(SecretRegistry);
	});

	it('should mask a config secret in the message', () => {
		const line = toJsonLine({ message: `connecting with ${SECRET}` });

		expect(line.message).to.equal('connecting with ***');
	});

	it('should mask a config secret in the metadata', () => {
		const line = toJsonLine({ message: 'request failed', data: { config: { value: SECRET } }, list: [SECRET] });

		expect(line.data).to.eql({ config: { value: '***' } });
		expect(line.list).to.eql(['***']);
	});

	it('should mask a JSON-escaped config secret', () => {
		const line = toJsonLine({ message: 'body', body: JSON.stringify({ value: SECRET }) });

		expect(line.body).to.equal('{"value":"***"}');
	});

	it('should mask a URL-encoded config secret', () => {
		const line = toJsonLine({
			message: `GET /callback?code=${encodeURIComponent(SECRET)}`,
			url: `https://example.com/?${new URLSearchParams({ code: SECRET }).toString()}`,
		});

		expect(line.message).to.equal('GET /callback?code=***');
		expect(line.url).to.equal('https://example.com/?code=***');
	});

	it('should mask a config secret in Basic auth', () => {
		const line = toJsonLine({ message: 'call', header: `Basic ${Buffer.from(`client:${SECRET}`).toString('base64')}` });

		expect(line.header).to.equal('Basic ***');
	});

	it('should mask a config secret in an error', () => {
		const line = toJsonLine({ message: 'failed', error: new Error(`invalid ${SECRET}`) });

		expect(line.error.message).to.equal('invalid ***');
	});

	it('should redact values of sensitive field names', () => {
		const line = toJsonLine({
			message: 'login',
			user: { name: 'max', password: 'not-a-config-secret' },
			accessToken: 'abcdefghijklmnopqrstuvwxyz',
		});

		expect(line.user).to.eql({ name: 'max', password: 'not-...et [REDACTED]' });
		expect(line.accessToken).to.equal('abcd...yz [REDACTED]');
	});

	it('should fully mask a config secret under a sensitive field name', () => {
		const line = toJsonLine({ message: 'login', password: SECRET, headers: { authorization: `Bearer ${SECRET}` } });

		expect(line.password).to.equal('[REDACTED]');
		expect(line.headers.authorization).to.equal('Bearer [REDACTED]');
		expect(JSON.stringify(line)).not.to.include(SECRET.slice(0, 4));
	});

	it('should redact Bearer tokens in the message', () => {
		const line = toJsonLine({ message: 'header Bearer abcdefghijklmnopqrstuvwxyz' });

		expect(line.message).to.equal('header Bearer abcd...yz [REDACTED]');
	});

	it('should leave non-secret output unchanged', () => {
		const createdAt = new Date('2026-01-02T03:04:05.000Z');
		const id = new ObjectId();
		const doc = { toJSON: () => ({ _id: id, createdAt }) };

		const line = toJsonLine({ message: 'plain message', count: 3, createdAt, id, doc, nested: { a: ['b', 1] } });

		expect(line).to.include({ level: 'info', message: 'plain message', count: 3, type: 'log' });
		expect(line.createdAt).to.equal(createdAt.toISOString());
		expect(line.id).to.equal(id.toHexString());
		expect(line.doc).to.eql({ _id: id.toHexString(), createdAt: createdAt.toISOString() });
		expect(line.nested).to.eql({ a: ['b', 1] });
		expect(line.timestamp).to.be.a('string');
	});

	it('should not change the objects passed to the logger', () => {
		const meta = { config: { value: SECRET }, token: 'abcdefghijklmnopqrstuvwxyz' };

		toJsonLine({ message: 'meta', meta });

		expect(meta).to.eql({ config: { value: SECRET }, token: 'abcdefghijklmnopqrstuvwxyz' });
	});

	it('should not change the object passed as the whole log entry', () => {
		// logger.info(obj) and logger.log(obj) pass the caller's object itself through the formats.
		const entry = { level: 'info', message: `x ${SECRET}`, password: 'plainpassword123' };

		const line = JSON.parse(getProductionFormat().transform(entry)[MESSAGE]);

		expect(line.password).to.equal('plai...23 [REDACTED]');
		expect(entry.password).to.equal('plainpassword123');
		expect(entry.message).to.equal(`x ${SECRET}`);
	});

	it('should log dates inside class instances and errors as in JSON', () => {
		class Thing {
			constructor() {
				this.createdAt = new Date('2026-01-02T03:04:05.000Z');
			}
		}
		const error = new Error('boom');
		error.data = { at: new Date('2026-01-02T03:04:05.000Z') };

		const line = toJsonLine({ message: 'dates', thing: new Thing(), error });

		expect(line.thing).to.eql({ createdAt: '2026-01-02T03:04:05.000Z' });
		expect(line.error).to.include({ name: 'Error', message: 'boom' });
		expect(line.error.stack).to.include('Error: boom');
		expect(line.error.data).to.eql({ at: '2026-01-02T03:04:05.000Z' });
	});

	it('should log a value whose toJSON throws by its fields', () => {
		const line = toJsonLine({
			message: 'broken',
			broken: {
				a: 1,
				toJSON: () => {
					throw new Error('toJSON failed');
				},
			},
		});

		expect(line.broken).to.eql({ a: 1 });
	});

	it('should summarize buffers as binary like the Nest logger', () => {
		const line = toJsonLine({ message: 'binary', buffer: Buffer.from('hello') });

		expect(line.buffer).to.equal('[Binary 5 bytes]');
	});

	it('should log an object referenced twice both times', () => {
		const shared = { a: 1 };

		const line = toJsonLine({ message: 'shared', x: shared, y: shared, list: [shared, shared] });

		expect(line.x).to.eql({ a: 1 });
		expect(line.y).to.eql({ a: 1 });
		expect(line.list).to.eql([{ a: 1 }, { a: 1 }]);
	});

	it('should log a real cycle as [Circular]', () => {
		const parent = { name: 'parent' };
		parent.self = parent;
		const doc = { id: 1 };
		doc.toJSON = () => ({ id: 1, original: doc });

		const line = toJsonLine({ message: 'cycle', parent, doc });

		expect(line.parent).to.eql({ name: 'parent', self: '[Circular]' });
		expect(line.doc).to.eql({ id: 1, original: '[Circular]' });
	});

	it('should keep message and stack of an error logged on its own in the test format', () => {
		// logger.error(error) passes the error itself as the log entry.
		const error = new Error(`boom ${SECRET}`);
		error.level = 'error';

		const output = getTestFormat().transform(error)[MESSAGE];

		expect(output).to.include('boom ***');
		expect(output).to.include('at ');
		expect(output).not.to.include(SECRET);
	});

	it('should log a safe entry instead of throwing when a getter throws', () => {
		const entry = { level: 'info', message: `getter ${SECRET}`, password: 'plainpassword123' };
		Object.defineProperty(entry, 'broken', {
			enumerable: true,
			get: () => {
				throw new Error('getter failed');
			},
		});

		const line = JSON.parse(getProductionFormat().transform(entry)[MESSAGE]);

		expect(line).to.include({ level: 'info', message: 'getter ***', maskingFailed: true });
		expect(line).not.to.have.property('password');
	});

	it('should log a safe entry instead of throwing for very deep nesting', () => {
		const deep = {};
		let current = deep;
		for (let i = 0; i < 20000; i += 1) {
			current.next = { value: SECRET };
			current = current.next;
		}

		const line = JSON.parse(getProductionFormat().transform({ level: 'info', message: 'deep', deep })[MESSAGE]);

		expect(line).to.include({ level: 'info', message: 'deep', maskingFailed: true });
		expect(line).not.to.have.property('deep');
	});

	it('should log only the summary of an axios error passed as the whole entry', () => {
		const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', {
			url: 'https://idm.example.com/token',
			method: 'post',
			headers: { Authorization: 'Basic dXNlcjpwYXNzd29yZDEyMw==' },
			data: '{"client_secret":"topsecretvalue99"}',
		});
		error.level = 'error';

		const output = getProductionFormat().transform(error)[MESSAGE];

		expect(output).not.to.include('dXNlcjpwYXNzd29yZDEyMw==');
		expect(output).not.to.include('topsecretvalue99');
		expect(JSON.parse(output)).to.include({ level: 'error', message: 'Request failed', type: 'error' });
	});

	it('should not log the result of an own toJSON of the whole entry', () => {
		const entry = { level: 'info', message: 'entry', password: 'plainpassword123' };
		entry.toJSON = () => ({ password: 'plainpassword123', raw: SECRET });

		const output = getProductionFormat().transform(entry)[MESSAGE];

		expect(output).not.to.include('plainpassword123');
		expect(output).not.to.include(SECRET);
		expect(JSON.parse(output)).to.include({ level: 'info', message: 'entry' });
	});

	it('should not leave any part of a secret in an error message or a self-returning toJSON', () => {
		const obj = {
			password: SECRET,
			toJSON() {
				return this;
			},
		};

		const output = getProductionFormat().transform({
			level: 'error',
			message: 'nested',
			error: new Error(`Bearer ${SECRET}`),
			obj,
		})[MESSAGE];

		expect(output).not.to.include(SECRET.slice(0, 4));
		expect(output).not.to.include(JSON.stringify(SECRET.slice(-2)).slice(1, -1));
		expect(JSON.parse(output).obj).to.eql({ password: '[REDACTED]' });
	});

	it('should mask in the develop format as well', () => {
		const output = getDevelopFormat().transform({ level: 'info', message: `secret ${SECRET}`, password: 'abc' })[
			MESSAGE
		];

		expect(output).to.include('secret ***');
		expect(output).not.to.include(SECRET);
		expect(output).to.include('[REDACTED]');
	});

	it('should keep the winston symbol keys', () => {
		const info = maskSensitiveData().transform({ level: 'info', message: 'x', [Symbol.for('level')]: 'info' });

		expect(info[Symbol.for('level')]).to.equal('info');
	});
});
