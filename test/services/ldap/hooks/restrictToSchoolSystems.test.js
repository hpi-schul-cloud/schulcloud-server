const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const reqlib = require('app-root-path').require;

const { BadRequest, Forbidden } = reqlib('src/errors');
const fut = require('../../../../src/services/ldap/hooks/restrictToSchoolSystems');

describe('restrictToSchoolSystems', () => {
	it("rejects requests that don't meet the requirements", () => {
		try {
			fut({});
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
			expect(err.message).to.equal('Unexpected call to restrictToValidSystems.');
		}
		try {
			fut({ id: new ObjectId().toString() });
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
			expect(err.message).to.equal('Unexpected call to restrictToValidSystems.');
		}
		try {
			fut({ params: { school: { systems: [] } } });
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
			expect(err.message).to.equal('Unexpected call to restrictToValidSystems.');
		}
	});

	it('should forbid access to systems not in use by the current school', () => {
		try {
			fut({
				id: new ObjectId().toString(),
				params: {
					school: {
						systems: [new ObjectId(), new ObjectId()],
					},
				},
			});
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(Forbidden);
		}
	});

	it('should forbid access if the current school has no system', () => {
		try {
			fut({
				id: new ObjectId().toString(),
				params: {
					school: {
						systems: [],
					},
				},
			});
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(Forbidden);
		}
	});

	it('should allow access if the school uses the system', () => {
		const systemId = new ObjectId();
		const context = {
			id: systemId.toString(),
			params: {
				school: {
					systems: [systemId, new ObjectId()],
				},
			},
		};
		const result = fut(context);
		expect(result).to.equal(context);
	});
});
