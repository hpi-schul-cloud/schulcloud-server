const { expect } = require('chai');
const assert = require('assert');
const { encryptSecret, decryptSecret } = require('../../../../src/services/system/hooks/searchUserPasswordEncryption');

describe('Search User Password Encryption Hook', () => {
	it('encrypts and decrypts pw', async () => {
		let context = {
			data: {
				ldapConfig: { searchUserPassword: 'DummyPW12!' },
			},
		};

		context = await encryptSecret(context);
		context.result = {
			ldapConfig: { searchUserPassword: context.data.ldapConfig.searchUserPassword },
		};
		context = await decryptSecret(context);

		expect(context.result.ldapConfig.searchUserPassword).to.equal('DummyPW12!');
	});

	it('encrypts and decrypts pw in array', async () => {
		let context = {
			data: {
				ldapConfig: { searchUserPassword: 'DummyPW12!' },
			},
		};

		context = await encryptSecret(context);
		context.result = [
			{
				ldapConfig: { searchUserPassword: context.data.ldapConfig.searchUserPassword },
			},
		];
		context = await decryptSecret(context);

		expect(context.result[0].ldapConfig.searchUserPassword).to.equal('DummyPW12!');
	});

	it('ignores systems without ldap config', async () => {
		let context = { data: {}, result: {} };

		context = await encryptSecret(context);
		context = await decryptSecret(context);

		assert.deepEqual(context, { data: {}, result: {} });
	});

	it('ignores systems without ldap config in array', async () => {
		let context = { data: {}, result: [{}] };

		context = await encryptSecret(context);
		context = await decryptSecret(context);

		assert.deepEqual(context, { data: {}, result: [{}] });
	});
});
