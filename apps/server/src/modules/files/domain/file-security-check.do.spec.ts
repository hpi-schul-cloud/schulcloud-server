import { FileSecurityCheck } from './file-security-check.do';
import { FileSecurityCheckStatus } from './types';

describe(FileSecurityCheck.name, () => {
	const setup = () => {
		const props = {
			createdAt: new Date(2023, 8, 1, 0, 0, 15),
			updatedAt: new Date(2023, 8, 1, 0, 0, 42),
			status: FileSecurityCheckStatus.VERIFIED,
			reason: 'AV scanning done',
			requestToken: '9bbde706-9297-46a4-8082-24535e25824b',
		};

		const domainObject = new FileSecurityCheck(props);

		return { props, domainObject };
	};

	describe('getProps', () => {
		it('should return proper copy of the props object', () => {
			const { props, domainObject } = setup();

			const doProps = domainObject.getProps();

			expect(doProps).toEqual(props);

			// Verify if the returned props object is an actual
			// (deep) copy and not just the original props object.
			expect(doProps === props).toEqual(false);
			expect(doProps.createdAt === props.createdAt).toEqual(false);
			expect(doProps.updatedAt === props.updatedAt).toEqual(false);
		});
	});

	describe('getters', () => {
		it('getters should return proper values from the props passed via constructor', () => {
			const { props, domainObject } = setup();

			const gettersValues = {
				createdAt: domainObject.createdAt,
				updatedAt: domainObject.updatedAt,
				status: domainObject.status,
				reason: domainObject.reason,
				requestToken: domainObject.requestToken,
			};

			expect(gettersValues).toEqual(props);
		});
	});
});
