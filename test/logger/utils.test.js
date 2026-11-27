const { expect } = require('chai');
const { AxiosError } = require('axios');
const { ObjectId } = require('bson');
const MESSAGE = Symbol.for('message');

const { SecretRegistry } = require('../../dist/apps/server/infra/configuration/secret-registry');
const { SecretRegistry: registryFromFacade } = require('../../dist/apps/server/infra/configuration');
const { getProductionFormat, getDevelopFormat, getTestFormat, maskSensitiveData } = require('../../src/logger/utils');
const { syncLogger } = require('../../src/logger/syncLogger');
const requestLog = require('../../src/logger/RequestLogger');

const SECRET = 'my+secret/value="1"';

const toJsonLine = (info) => JSON.parse(getProductionFormat().transform({ level: 'info', ...info })[MESSAGE]);

describe('[logger] masking in the feathers logger', () => {
	let savedSecrets;

	beforeEach(() => {
		// Other tests in the same mocha process may have registered secrets (e.g. S3_KEY of config/test.json when
		// the Nest configuration was loaded). Each test starts with only its own secret; the others are restored afterwards.
		savedSecrets = [...SecretRegistry.getSecrets()];
		SecretRegistry.clear();
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

		expect(line.user).to.eql({ name: 'max', password: '[REDACTED]' });
		expect(line.accessToken).to.equal('abcd...yz [REDACTED]');
	});

	it('should fully mask a config secret under a sensitive field name', () => {
		const line = toJsonLine({ message: 'login', clientSecret: SECRET, headers: { authorization: `Bearer ${SECRET}` } });

		// clientSecret is shortened by LoggingUtils, not fully redacted like passwords: only the masking order hides it.
		expect(line.clientSecret).to.equal('[REDACTED]');
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

		expect(line.password).to.equal('[REDACTED]');
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

	it('should log very deep nesting up to a depth limit', () => {
		const deep = {};
		let current = deep;
		for (let i = 0; i < 20000; i += 1) {
			current.next = { value: SECRET };
			current = current.next;
		}

		const output = getProductionFormat().transform({ level: 'info', message: 'deep', deep })[MESSAGE];

		const line = JSON.parse(output);
		expect(line).not.to.have.property('maskingFailed');
		expect(line.deep.next.value).to.equal('***');
		expect(output).to.include('"next":"[Object]"');
		expect(output).not.to.include(SECRET);
	});

	it('should log an object shared on many levels quickly', () => {
		let node = { leaf: true };
		for (let i = 0; i < 20; i += 1) {
			node = { a: node, b: node };
		}

		const start = Date.now();
		const line = toJsonLine({ message: 'shared', node });

		expect(Date.now() - start).to.be.below(500);
		expect(line.node.a).to.eql(line.node.b);
		expect(JSON.stringify(line.node)).to.include('[Object]');
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

	describe('errors whose fields are getters on the prototype', () => {
		const createAbortError = () => {
			const controller = new AbortController();
			controller.abort();

			return controller.signal.reason;
		};

		it('should log a DOMException with name, message and stack', () => {
			const line = toJsonLine({ level: 'error', message: 'fetch failed', error: createAbortError() });

			expect(line).not.to.have.property('maskingFailed');
			expect(line.error).to.include({ name: 'AbortError', message: 'This operation was aborted' });
			expect(line.error.stack).to.include('AbortError');
		});

		it('should log a DOMException as the cause of an error', () => {
			const line = toJsonLine({
				level: 'error',
				message: 'm',
				error: new Error('outer', { cause: createAbortError() }),
			});

			expect(line).not.to.have.property('maskingFailed');
			expect(line.error.message).to.equal('outer');
			expect(line.error.cause).to.include({ name: 'AbortError', message: 'This operation was aborted' });
		});

		it('should log an error whose message getter reads a private field', () => {
			class PrivateMessageError extends Error {
				#text = `private ${SECRET}`;

				get message() {
					return this.#text;
				}
			}

			const line = toJsonLine({ level: 'error', message: 'm', error: new PrivateMessageError() });

			expect(line).not.to.have.property('maskingFailed');
			expect(line.error).to.include({ name: 'PrivateMessageError', message: 'private ***' });
		});
	});

	it('should log the content of a Map and a Set', () => {
		const line = toJsonLine({
			message: 'collections',
			map: new Map([['token', SECRET]]),
			set: new Set(['a', SECRET]),
		});

		expect(line.map).to.eql({ token: '[REDACTED]' });
		expect(line.set).to.eql(['a', '***']);
	});

	it('should redact values of a Map by their key names', () => {
		const output = getProductionFormat().transform({
			level: 'info',
			message: 'map',
			map: new Map([
				['password', 'hunter2secret'],
				['x-api-key', 'supersecretkey'],
				['name', 'max'],
			]),
			byId: new Map([[1, { password: 'hunter2secret', value: SECRET }]]),
		})[MESSAGE];

		const line = JSON.parse(output);
		expect(output).not.to.include('hunter2secret');
		expect(output).not.to.include('supersecretkey');
		expect(line.map).to.eql({
			password: '[REDACTED]',
			'x-api-key': 'supe...ey [REDACTED]',
			name: 'max',
		});
		expect(line.byId).to.eql([[1, { password: '[REDACTED]', value: '***' }]]);
	});

	it('should not keep the caller arguments of the splat symbol', () => {
		const info = maskSensitiveData().transform({
			level: 'info',
			message: 'x',
			[Symbol.for('splat')]: [{ password: 'plainpassword123' }],
		});

		expect(info).not.to.have.property(Symbol.for('splat'));
	});

	it('should mask a config secret in a key of the entry', () => {
		// A secret without a sensitive word, otherwise the value would be redacted by the key name as well.
		const keySecret = 'plainkeyvalue99';
		SecretRegistry.register(keySecret);

		const output = getProductionFormat().transform({
			level: 'info',
			message: 'keys',
			[keySecret]: 1,
			nested: { [keySecret]: 2 },
		})[MESSAGE];

		const line = JSON.parse(output);
		expect(output).not.to.include(keySecret);
		expect(line['***']).to.equal(1);
		expect(line.nested).to.eql({ '***': 2 });
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

	describe('URL secrets in the finished line', () => {
		const TOKEN = 'resettoken123abc';
		const SHARE_TOKEN = 'sharetokenvalue42';

		// Collects what the console transports write. winston writes asynchronously, so it waits for the expected
		// number of writes (the request logger's transport is not exported, so its 'logged' event cannot be awaited).
		const captureOutput = async (log, expectedWrites) => {
			const lines = [];
			const originalWrite = process.stdout.write;
			try {
				await new Promise((resolve) => {
					process.stdout.write = (chunk, ...args) => {
						lines.push(String(chunk));
						if (lines.length === expectedWrites) {
							resolve();
						}
						const callback = args.find((arg) => typeof arg === 'function');
						if (callback) {
							callback();
						}

						return true;
					};
					log();
				});
			} finally {
				process.stdout.write = originalWrite;
			}

			return lines.join('');
		};

		it('should redact secret paths and query params in the message, metadata and a nested stack', () => {
			const error = new Error(`Cannot GET /passwordRecovery/${TOKEN}`);

			const output = getProductionFormat().transform({
				level: 'info',
				message: `GET /api/v1/passwordRecovery/${TOKEN} and /courses?shareToken=${SHARE_TOKEN}&page=2`,
				url: `https://host/passwordRecovery/${TOKEN}`,
				error,
			})[MESSAGE];

			const line = JSON.parse(output);
			expect(output).not.to.include(TOKEN);
			expect(output).not.to.include(SHARE_TOKEN);
			expect(line.message).to.equal('GET /api/v1/passwordRecovery/*** and /courses?shareToken=***&page=2');
			expect(line.url).to.equal('https://host/passwordRecovery/***');
			expect(line.error.stack).to.include('Cannot GET /passwordRecovery/***');
		});

		it('should redact URL secrets in the develop and test formats', () => {
			const info = { level: 'info', message: `GET /passwordRecovery/${TOKEN}?shareToken=${SHARE_TOKEN}&page=2` };

			const develop = getDevelopFormat().transform({ ...info })[MESSAGE];
			const test = getTestFormat().transform({ ...info })[MESSAGE];

			for (const output of [develop, test]) {
				expect(output).not.to.include(TOKEN);
				expect(output).not.to.include(SHARE_TOKEN);
				expect(output).to.include('page=2');
			}
		});

		it('should leave lines without URL secrets unchanged', () => {
			const info = { level: 'info', message: 'GET /passwordRecovery/reset?page=2&sort=name', timestamp: 't' };

			const line = JSON.parse(getProductionFormat().transform(info)[MESSAGE]);

			expect(line.message).to.equal('GET /passwordRecovery/reset?page=2&sort=name');
		});

		it('should redact URL secrets in the request logger and the sync logger output', async () => {
			const output = await captureOutput(() => {
				requestLog(`GET /passwordRecovery/${TOKEN}?shareToken=${SHARE_TOKEN}&page=2`);
				syncLogger.error(`sync failed for /passwordRecovery/${TOKEN}`);
			}, 2);

			expect(output).to.include('Request GET /passwordRecovery/***?shareToken=***&page=2');
			expect(output).to.include('sync failed for /passwordRecovery/***');
			expect(output).not.to.include(TOKEN);
			expect(output).not.to.include(SHARE_TOKEN);
		});
	});
});
