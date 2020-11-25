const { expect } = require('chai');
const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');

const fut = require('../../../../src/services/ldap-config/hooks/fillDefaultValues');

describe('fillDefaultValues', () => {
	it('should fail if pre-requisites are not met', () => {
		expect(() => fut({})).to.throw(BadRequest);
		expect(() => fut({ data: {} })).to.throw(BadRequest);
		expect(() =>
			fut({
				data: {
					provider: 'foo',
					providerOptions: {
						bar: 'baz',
					},
				},
			})
		).to.throw(BadRequest);
	});

	it('should override the given provider with "general"', () => {
		const context = {
			data: {
				provider: 'test',
				providerOptions: {
					userAttributeNameMapping: {},
				},
			},
		};
		const result = fut(context);
		expect(result.data.provider).to.equal('general');
	});

	it('should set attribute mappings for dn to "dn"', () => {
		const context = {
			data: {
				provider: 'test',
				providerOptions: {
					userAttributeNameMapping: {},
					classAttributeNameMapping: {},
				},
			},
		};
		const result = fut(context);
		expect(result.data.providerOptions.userAttributeNameMapping.dn).to.equal('dn');
		expect(result.data.providerOptions.classAttributeNameMapping.dn).to.equal('dn');
	});

	it('should allow setting the attribute mapping for dn', () => {
		const context = {
			data: {
				provider: 'test',
				providerOptions: {
					userAttributeNameMapping: { dn: 'foo' },
					classAttributeNameMapping: { dn: 'bar' },
				},
			},
		};
		const result = fut(context);
		expect(result.data.providerOptions.userAttributeNameMapping.dn).to.equal('foo');
		expect(result.data.providerOptions.classAttributeNameMapping.dn).to.equal('bar');
	});
});
