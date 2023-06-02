import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain';
import { RoleReference } from '@shared/domain/domainobject';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import {
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
	ProvisioningSystemDto,
} from '../../dto';
import { OidcProvisioningStrategy } from './oidc.strategy';
import { OidcProvisioningService } from './service/oidc-provisioning.service';

class TestOidcStrategy extends OidcProvisioningStrategy {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		throw new NotImplementedException();
	}

	getType(): SystemProvisioningStrategy {
		throw new NotImplementedException();
	}
}

describe('OidcStrategy', () => {
	let module: TestingModule;
	let strategy: TestOidcStrategy;

	let oidcProvisioningService: DeepMocked<OidcProvisioningService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TestOidcStrategy,
				{
					provide: OidcProvisioningService,
					useValue: createMock<OidcProvisioningService>(),
				},
			],
		}).compile();

		strategy = module.get(TestOidcStrategy);
		oidcProvisioningService = module.get(OidcProvisioningService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('apply is called', () => {
		const setup = () => {
			const externalUserId = 'externalUserId';
			const externalSchoolId = 'externalSchoolId';
			const schoolId = 'schoolId';
			const oauthData: OauthDataDto = new OauthDataDto({
				system: new ProvisioningSystemDto({
					systemId: 'systemId',
					provisioningStrategy: SystemProvisioningStrategy.OIDC,
				}),
				externalSchool: new ExternalSchoolDto({
					externalId: externalSchoolId,
					name: 'schoolName',
				}),
				externalUser: new ExternalUserDto({
					externalId: externalUserId,
				}),
			});
			const user: UserDO = new UserDO({
				firstName: 'firstName',
				lastName: 'lastName',
				email: 'email',
				schoolId: 'schoolId',
				roles: [new RoleReference({ id: 'roleId', name: RoleName.USER })],
				externalId: externalUserId,
			});
			const school: SchoolDO = new SchoolDO({
				id: schoolId,
				name: 'schoolName',
				externalId: externalSchoolId,
			});

			oidcProvisioningService.provisionExternalSchool.mockResolvedValue(school);
			oidcProvisioningService.provisionExternalUser.mockResolvedValue(user);

			return {
				oauthData,
				schoolId,
			};
		};

		describe('when school data is provided', () => {
			it('should call the OidcProvisioningService.provisionExternalSchool', async () => {
				const { oauthData } = setup();

				await strategy.apply(oauthData);

				expect(oidcProvisioningService.provisionExternalSchool).toHaveBeenCalledWith(
					oauthData.externalSchool,
					oauthData.system.systemId
				);
			});
		});

		describe('when user data is provided', () => {
			it('should call the OidcProvisioningService.provisionExternalUser', async () => {
				const { oauthData, schoolId } = setup();

				await strategy.apply(oauthData);

				expect(oidcProvisioningService.provisionExternalUser).toHaveBeenCalledWith(
					oauthData.externalUser,
					oauthData.system.systemId,
					schoolId
				);
			});

			it('should return the users external id', async () => {
				const { oauthData } = setup();

				const result: ProvisioningDto = await strategy.apply(oauthData);

				expect(result).toEqual(new ProvisioningDto({ externalUserId: oauthData.externalUser.externalId }));
			});
		});
	});
});
