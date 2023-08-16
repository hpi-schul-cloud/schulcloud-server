import { FileSecurityCheck } from './file-security-check.do';
import { FileSecurityCheckStatus } from './types';

describe(FileSecurityCheck.name, () => {
	it('getters should return proper values from the props passed via constructor', () => {
		const props = {
			createdAt: new Date(2023, 8, 1, 0, 0, 15),
			updatedAt: new Date(2023, 8, 1, 0, 0, 42),
			status: FileSecurityCheckStatus.VERIFIED,
			reason: 'AV scanning done',
			requestToken: '9bbde706-9297-46a4-8082-24535e25824b',
		};

		const fileSecurityCheck = new FileSecurityCheck(props);

		const gettersValues = {
			createdAt: fileSecurityCheck.createdAt,
			updatedAt: fileSecurityCheck.updatedAt,
			status: fileSecurityCheck.status,
			reason: fileSecurityCheck.reason,
			requestToken: fileSecurityCheck.requestToken,
		};

		expect(gettersValues).toEqual(props);
	});
});
