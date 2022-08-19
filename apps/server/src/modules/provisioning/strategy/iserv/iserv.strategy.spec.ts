import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { IservProvisioningStrategy } from '@src/modules/provisioning/strategy/iserv/iserv.strategy';
import { UUID } from 'bson';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';

const params = {
	idToken: 'iservIdToken',
};
interface IIservJwt {
	uuid: string;
}
jest.mock('jwt-decode', () => ({}));
describe('IservStrategy', () => {
	let iservStrategy: IservProvisioningStrategy;

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('apply', () => {
		const userUUID: UUID = new UUID('aef1f4fd-c323-466e-962b-a84354c0e713');
		beforeEach(() => {});

		it('should apply strategy', async () => {
			// Arrange
			jest.mock('jwt-decode', () => ({ ... }))
			// Act
			const result = await iservStrategy.apply(params);

			// Assert
			expect(result.externalUserId).toEqual(userUUID);
		});

		it('should throw error when there is no idToken', async () => {
			// Arrange
			params.idToken = '';
			// Act & Assert
			await expect(iservStrategy.apply(params)).rejects.toThrow(OAuthSSOError);
		});
	});

	describe('getType', () => {
		it('should return type SANIS', () => {
			const retType: SystemProvisioningStrategy = iservStrategy.getType();
			expect(retType).toEqual(SystemProvisioningStrategy.ISERV);
		});
	});
});
