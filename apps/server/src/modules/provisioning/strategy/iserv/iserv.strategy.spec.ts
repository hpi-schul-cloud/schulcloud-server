import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { LegacySchoolService } from '@modules/legacy-school';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo, UserDO } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { legacySchoolDoFactory, userDoFactory } from '@shared/testing';
import {
	IdTokenExtractionFailureLoggableException,
	IdTokenUserNotFoundLoggableException,
} from '@src/modules/oauth/loggable';
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

	let schoolService: DeepMocked<LegacySchoolService>;
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				IservProvisioningStrategy,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
			],
		}).compile();

		strategy = module.get(IservProvisioningStrategy);
		schoolService = module.get(LegacySchoolService);
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
				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.STUDENT }]).buildWithId({
					externalId: userUUID,
				});
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({ externalId: 'schoolExternalId' });
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

				await expect(func).rejects.toThrow(new IdTokenExtractionFailureLoggableException('uuid'));
			});
		});

		describe('when no user with the externalId is found', () => {
			it('should throw an error with code sso_user_notfound and additional information', async () => {
				const { input, userUUID, email } = setup();
				const schoolId: string = new ObjectId().toHexString();
				const user: UserDO = userDoFactory.buildWithId({
					externalId: userUUID,
					schoolId,
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return { uuid: userUUID, email };
				});
				userService.findByExternalId.mockResolvedValue(null);
				userService.findByEmail.mockResolvedValue([user]);

				const func = () => strategy.getData(input);

				await expect(func).rejects.toThrow(
					new IdTokenUserNotFoundLoggableException(userUUID, `email: ${email}, schoolId: ${schoolId}`)
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

				await expect(func).rejects.toThrow(new IdTokenUserNotFoundLoggableException(userUUID));
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
