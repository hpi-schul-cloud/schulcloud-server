import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { IservProvisioningStrategy } from '@src/modules/provisioning/strategy/iserv/iserv.strategy';
import { UUID } from 'bson';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

const params = {
	idToken: 'iservIdToken',
};

describe('IservStrategy', () => {
	let module: TestingModule;
	let iservStrategy: IservProvisioningStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [IservProvisioningStrategy],
		}).compile();
		iservStrategy = module.get(IservProvisioningStrategy);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('apply', () => {
		const userUUID: UUID = new UUID();

		beforeAll(() => {
			jest.spyOn(jwt, 'decode').mockImplementation(() => {
				return { uuid: userUUID };
			});
		});

		it('should apply strategy', async () => {
			const result = await iservStrategy.apply(params);

			expect(result.externalUserId).toEqual(userUUID);
		});

		it('should throw error when there is no uuid in the idToken', async () => {
			jest.spyOn(jwt, 'decode').mockImplementationOnce(() => {
				return {};
			});
			await expect(iservStrategy.apply(params)).rejects.toThrow(OAuthSSOError);
		});

		it('should throw error when there is no idToken', async () => {
			jest.spyOn(jwt, 'decode').mockImplementationOnce(() => null);
			await expect(iservStrategy.apply(params)).rejects.toThrow(OAuthSSOError);
		});
	});

	describe('getType', () => {
		it('should return type ISERV', () => {
			const retType: SystemProvisioningStrategy = iservStrategy.getType();
			expect(retType).toEqual(SystemProvisioningStrategy.ISERV);
		});
	});
});
