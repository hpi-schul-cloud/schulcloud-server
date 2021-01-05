const { expect } = require('chai');
const reqlib = require('app-root-path').require;

const {
	BadRequest,
	NotAuthenticated,
	AutoLogout,
	PaymentError,
	Forbidden,
	NotFound,
	MethodNotAllowed,
	NotAcceptable,
	Timeout,
	SlowQuery,
	Conflict,
	LengthRequired,
	Unprocessable,
	TooManyRequests,
	BruteForcePrevention,
	GeneralError,
	NotImplemented,
	BadGateway,
	Unavailable,
	SilentError,
	PageNotFound,
	Gone,
	NoClientInstanceError,
	UnhandledRejection,
	UnhandledException,
	ApplicationError,
	FeathersError,
} = reqlib('src/errors');
const logger = reqlib('src/logger');

describe('errors', () => {
	const message = 'Something go wrong.';
	it('new BadRequest', () => {
		const err = new BadRequest(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(400);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('bad-request');
		expect(err.name, 'should the name of constructor').to.equal('BadRequest');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('NotAuthenticated', () => {
		const err = new NotAuthenticated(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(401);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('not-authenticated');
		expect(err.name, 'should the name of constructor').to.equal('NotAuthenticated');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new AutoLogout', () => {
		const err = new AutoLogout(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(401);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('auto-logout');
		expect(err.name, 'should the name of constructor').to.equal('AutoLogout');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new PaymentError', () => {
		const err = new PaymentError(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(402);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('payment-error');
		expect(err.name, 'should the name of constructor').to.equal('PaymentError');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new Forbidden', () => {
		const err = new Forbidden(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(403);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('forbidden');
		expect(err.name, 'should the name of constructor').to.equal('Forbidden');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new NotFound', () => {
		const err = new NotFound(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(404);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('not-found');
		expect(err.name, 'should the name of constructor').to.equal('NotFound');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new MethodNotAllowed', () => {
		const err = new MethodNotAllowed(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(405);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('method-not-allowed');
		expect(err.name, 'should the name of constructor').to.equal('MethodNotAllowed');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new NotAcceptable', () => {
		const err = new NotAcceptable(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(406);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('not-acceptable');
		expect(err.name, 'should the name of constructor').to.equal('NotAcceptable');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new Timeout', () => {
		const err = new Timeout(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(408);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('timeout');
		expect(err.name, 'should the name of constructor').to.equal('Timeout');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new SlowQuery', () => {
		const err = new SlowQuery(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(408);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('slow-query');
		expect(err.name, 'should the name of constructor').to.equal('SlowQuery');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new Conflict', () => {
		const err = new Conflict(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(409);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('conflict');
		expect(err.name, 'should the name of constructor').to.equal('Conflict');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new LengthRequired', () => {
		const err = new LengthRequired(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(411);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('length-required');
		expect(err.name, 'should the name of constructor').to.equal('LengthRequired');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new Unprocessable', () => {
		const err = new Unprocessable(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(422);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('unprocessable');
		expect(err.name, 'should the name of constructor').to.equal('Unprocessable');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new TooManyRequests', () => {
		const err = new TooManyRequests(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(429);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('too-many-requests');
		expect(err.name, 'should the name of constructor').to.equal('TooManyRequests');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new BruteForcePrevention', () => {
		const err = new BruteForcePrevention(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(429);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('brute-force-prevention');
		expect(err.name, 'should the name of constructor').to.equal('BruteForcePrevention');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new GeneralError', () => {
		const err = new GeneralError(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(500);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('general-error');
		expect(err.name, 'should the name of constructor').to.equal('GeneralError');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new NotImplemented', () => {
		const err = new NotImplemented(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(501);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('not-implemented');
		expect(err.name, 'should the name of constructor').to.equal('NotImplemented');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new BadGateway', () => {
		const err = new BadGateway(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(502);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('bad-gateway');
		expect(err.name, 'should the name of constructor').to.equal('BadGateway');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new Unavailable', () => {
		const err = new Unavailable(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(503);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('unavailable');
		expect(err.name, 'should the name of constructor').to.equal('Unavailable');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new PageNotFound', () => {
		const err = new PageNotFound(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Should not allow any other message set it to "Page not found."').to.equal('Page not found.');
		expect(err.code).to.equal(404);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('page-not-found');
		expect(err.name, 'should the name of constructor').to.equal('PageNotFound');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new Gone', () => {
		const err = new Gone(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'message should empty string').to.equal('');
		expect(err.code, 'code should undefined').to.be.undefined;
		expect(err.type, 'type should undefined').to.be.undefined;
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('gone');
		expect(err.name, 'should the name of constructor').to.equal('Gone');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new UnhandledRejection', () => {
		const err = new UnhandledRejection(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(500);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('unhandled-rejection');
		expect(err.name, 'should the name of constructor').to.equal('UnhandledRejection');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new UnhandledException', () => {
		const err = new UnhandledException(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal(message);
		expect(err.code).to.equal(500);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('unhandled-exception');
		expect(err.name, 'should the name of constructor').to.equal('UnhandledException');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
	});

	it('new SilentError', () => {
		const err = new SilentError(message);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof ApplicationError).to.be.true;
		expect(err.cause, 'Use parameter one').to.equal(message);
		expect(err.name, 'should the name of constructor').to.equal('SilentError');
	});

	it('new NoClientInstanceError', () => {
		const err = new NoClientInstanceError(message);
		expect(err instanceof Error).to.be.true;
	});
});

describe('parameter for feathers errors', () => {
	it('work without parameter', () => {
		const err = new BadRequest();
		logger.info(err);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'set feather default - "Error"').to.equal('Error');
		expect(err.code).to.equal(400);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('bad-request');
		expect(err.name, 'should the name of constructor').to.equal('BadRequest');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors, 'errors should empty object').to.eql({});
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
		expect(err.stack).to.not.undefined;
	});

	it('work with js error at first parameter', () => {
		const err = new BadRequest(new Error('Test Error'));
		logger.info(err);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'use message from passed error').to.equal('Test Error');
		expect(err.code).to.equal(400);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('bad-request');
		expect(err.name, 'should the name of constructor').to.equal('BadRequest');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors instanceof Error, 'errors should empty object').to.be.true;
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
		expect(err.stack).to.not.undefined;
	});

	it('work with feather error at first parameter', () => {
		const err = new BadRequest(new Forbidden('Test Forbidden'));
		logger.info(err);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'use message from passed error').to.equal('Test Forbidden');
		expect(err.code).to.equal(400);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('bad-request');
		expect(err.name, 'should the name of constructor').to.equal('BadRequest');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors instanceof FeathersError, 'errors should empty object').to.be.true;
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
		expect(err.stack).to.not.undefined;
	});

	it('work with generic error at first parameter', () => {
		try {
			const a = undefined;
			a.forEach((e) => e.p);
		} catch (throwingError) {
			const err = new BadRequest(throwingError);
			logger.info(err);
			expect(err instanceof Error).to.be.true;
			expect(err instanceof FeathersError).to.be.true;
			expect(err.message, 'use message from passed error').to.equal("Cannot read property 'forEach' of undefined");
			expect(err.code).to.equal(400);
			expect(err.type).to.equal('FeathersError');
			expect(err.className, 'should the name of constructor as lower case notation').to.equal('bad-request');
			expect(err.name, 'should the name of constructor').to.equal('BadRequest');
			expect(err.data, 'should empty object').to.eql({});
			expect(err.errors instanceof Error, 'errors should empty object').to.be.true;
			expect(err.traceId, 'should contain a non empty string').to.not.undefined;
			expect(err.stack).to.not.undefined;
		}
	});

	it('work with js error at second parameter', () => {
		const err = new BadRequest('something go wrong', new Error('Test Error'));
		logger.info(err);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal('something go wrong');
		expect(err.code).to.equal(400);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('bad-request');
		expect(err.name, 'should the name of constructor').to.equal('BadRequest');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors instanceof Error, 'errors should empty object').to.be.true;
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
		expect(err.stack).to.not.undefined;
	});

	it('work with feather error at second parameter', () => {
		const err = new BadRequest('something go wrong', new Forbidden('Test Error'));
		logger.info(err);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal('something go wrong');
		expect(err.code).to.equal(400);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('bad-request');
		expect(err.name, 'should the name of constructor').to.equal('BadRequest');
		expect(err.data, 'should empty object').to.eql({});
		expect(err.errors instanceof FeathersError, 'errors should empty object').to.be.true;
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
		expect(err.stack).to.not.undefined;
	});

	it('work with generic error at second parameter', () => {
		try {
			const a = undefined;
			a.forEach((e) => e.p);
		} catch (throwingError) {
			const err = new BadRequest('something go wrong', throwingError);
			logger.info(err);
			expect(err instanceof Error).to.be.true;
			expect(err instanceof FeathersError).to.be.true;
			expect(err.message, 'use message from passed error').to.equal('something go wrong');
			expect(err.code).to.equal(400);
			expect(err.type).to.equal('FeathersError');
			expect(err.className, 'should the name of constructor as lower case notation').to.equal('bad-request');
			expect(err.name, 'should the name of constructor').to.equal('BadRequest');
			expect(err.data, 'should empty object').to.eql({});
			expect(err.errors instanceof Error, 'errors should empty object').to.be.true;
			expect(err.traceId, 'should contain a non empty string').to.not.undefined;
			expect(err.stack).to.not.undefined;
		}
	});

	it('work with additional parameter', () => {
		const err = new BadRequest(
			'something go wrong',
			new Error('Test Error'),
			{ k1: 'a', k2: 'b' },
			{ k3: 'c', k2: 'd' }
		);
		logger.info(err);
		expect(err instanceof Error).to.be.true;
		expect(err instanceof FeathersError).to.be.true;
		expect(err.message, 'Use parameter one').to.equal('something go wrong');
		expect(err.code).to.equal(400);
		expect(err.type).to.equal('FeathersError');
		expect(err.className, 'should the name of constructor as lower case notation').to.equal('bad-request');
		expect(err.name, 'should the name of constructor').to.equal('BadRequest');
		expect(err.data, 'should include of array with parameters').to.eql({
			0: { k1: 'a', k2: 'b' },
			1: { k3: 'c', k2: 'd' },
		});
		expect(err.errors instanceof Error, 'errors should empty object').to.be.true;
		expect(err.traceId, 'should contain a non empty string').to.not.undefined;
		expect(err.stack).to.not.undefined;
	});
});
