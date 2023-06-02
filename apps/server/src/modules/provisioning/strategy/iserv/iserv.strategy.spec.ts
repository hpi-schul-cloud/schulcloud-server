import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName, User } from '@shared/domain';
import { RoleReference } from '@shared/domain/domainobject';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { schoolFactory, setupEntities, userDoFactory, userFactory } from '@shared/testing';
import { schoolDOFactory } from '@shared/testing/factory/domainobject/school.factory';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import jwt from 'jsonwebtoken';
import { RoleDto } from '../../../role/service/dto/role.dto';
import {
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
	ProvisioningSystemDto,
} from '../../dto';
import { IservProvisioningStrategy } from './iserv.strategy';

jest.mock('jsonwebtoken');

describe('IservProvisioningStrategy', () => {
	let module: TestingModule;
	let strategy: IservProvisioningStrategy;

	let schoolService: DeepMocked<SchoolService>;
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				IservProvisioningStrategy,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		strategy = module.get(IservProvisioningStrategy);
		schoolService = module.get(SchoolService);
		userService = module.get(UserService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getType is called', () => {
		describe('when it is called', () => {
			it('should return type ISERV', () => {
				const result: SystemProvisioningStrategy = strategy.getType();

				expect(result).toEqual(SystemProvisioningStrategy.ISERV);
			});
		});
	});

	describe('getData is called', () => {
		const setup = () => {
			const userUUID = 'aef1f4fd-c323-466e-962b-a84354c0e713';
			const email = 'abc@def.de';
			const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
				system: new ProvisioningSystemDto({
					systemId: 'systemId',
					provisioningStrategy: SystemProvisioningStrategy.ISERV,
				}),
				accessToken: 'accessToken',
				idToken: 'idToken',
			});

			return {
				userUUID,
				email,
				input,
			};
		};

		describe('when the operation succeeds', () => {
			it('should return the user data', async () => {
				const { input, userUUID, email } = setup();
				const user: UserDO = userDoFactory.buildWithId({
					externalId: userUUID,
					roles: [new RoleReference({ id: 'roleId', name: RoleName.STUDENT })],
				});
				const school: SchoolDO = schoolDOFactory.buildWithId({ externalId: 'schoolExternalId' });
				const roleDto: RoleDto = new RoleDto({
					name: RoleName.STUDENT,
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return { uuid: userUUID, email };
				});
				userService.findByExternalId.mockResolvedValue(user);
				schoolService.getSchoolById.mockResolvedValue(school);

				const result: OauthDataDto = await strategy.getData(input);

				expect(result).toEqual<OauthDataDto>({
					system: input.system,
					externalUser: new ExternalUserDto({
						externalId: userUUID,
						email: user.email,
						roles: [roleDto.name],
						firstName: user.firstName,
						lastName: user.lastName,
					}),
					externalSchool: new ExternalSchoolDto({
						externalId: 'schoolExternalId',
						name: school.name,
						officialSchoolNumber: school.officialSchoolNumber,
					}),
				});
			});
		});

		describe('when the id token is invalid', () => {
			it('should throw an error with code sso_jwt_problem', async () => {
				const { input } = setup();

				jest.spyOn(jwt, 'decode').mockReturnValue(null);

				const func = () => strategy.getData(input);

				await expect(func).rejects.toThrow(new OAuthSSOError('Failed to extract uuid', 'sso_jwt_problem'));
			});
		});

		describe('when no user with the externalId is found', () => {
			it('should throw an error with code sso_user_notfound and additional information', async () => {
				const { input, userUUID, email } = setup();
				const schoolId: string = new ObjectId().toHexString();
				const user: User = userFactory.buildWithId({
					externalId: userUUID,
					school: schoolFactory.buildWithId(undefined, schoolId),
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return { uuid: userUUID, email };
				});
				userService.findByExternalId.mockResolvedValue(null);
				userService.findByEmail.mockResolvedValue([user]);

				const func = () => strategy.getData(input);

				await expect(func).rejects.toThrow(
					new OAuthSSOError(
						`Failed to find user with Id ${userUUID} [schoolId: ${schoolId}, currentLdapId: ${userUUID}]`,
						'sso_user_notfound'
					)
				);
			});

			it('should throw an error with code sso_user_notfound without additional information', async () => {
				const { input, userUUID, email } = setup();

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return { uuid: userUUID, email };
				});
				userService.findByExternalId.mockResolvedValue(null);
				userService.findByEmail.mockResolvedValue([]);

				const func = () => strategy.getData(input);

				await expect(func).rejects.toThrow(
					new OAuthSSOError(`Failed to find user with Id ${userUUID}`, 'sso_user_notfound')
				);
			});
		});
	});

	describe('apply is called', () => {
		describe('when oauth data is provided', () => {
			it('should return a provisioning dto with the external user id', async () => {
				const userUUID = 'aef1f4fd-c323-466e-962b-a84354c0e713';
				const data: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.ISERV,
					}),
					externalUser: new ExternalUserDto({ externalId: userUUID }),
				});

				const result: ProvisioningDto = await strategy.apply(data);

				expect(result).toEqual<ProvisioningDto>({
					externalUserId: userUUID,
				});
			});
		});
	});
});
