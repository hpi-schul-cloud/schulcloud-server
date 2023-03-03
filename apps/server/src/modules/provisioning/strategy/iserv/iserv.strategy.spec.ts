import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { RoleService } from '@src/modules/role';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import jwt from 'jsonwebtoken';
import {
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
	ProvisioningSystemDto,
} from '../../dto';
import { IservProvisioningStrategy } from './iserv.strategy';

jest.mock('jsonwebtoken');

describe('IservStrategy', () => {
	let module: TestingModule;
	let strategy: IservProvisioningStrategy;

	let schoolService: DeepMocked<SchoolService>;
	let userService: DeepMocked<UserService>;
	let roleService: DeepMocked<RoleService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				IservProvisioningStrategy,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
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
		roleService = module.get(RoleService);
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
		describe('when oauth input data is provided', () => {
			afterEach(() => {
				jest.resetAllMocks();
			});

			const setup = () => {
				const userUUID = 'aef1f4fd-c323-466e-962b-a84354c0e713';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.ISERV,
					}),
					accessToken: 'accessToken',
					idToken: 'idToken',
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return { uuid: userUUID };
				});

				return {
					userUUID,
					input,
				};
			};

			it('should fetch the user data', async () => {
				const { input, userUUID } = setup();

				const result: OauthDataDto = await strategy.getData(input);

				expect(result).toEqual<OauthDataDto>({
					system: input.system,
					externalUser: new ExternalUserDto({ externalId: userUUID }),
				});
			});

			it('should throw error when there is no uuid in the idToken', async () => {
				const { input } = setup();
				jest.spyOn(jwt, 'decode').mockReturnValue({});

				const result: Promise<OauthDataDto> = strategy.getData(input);

				await expect(result).rejects.toThrow(OAuthSSOError);
			});

			it('should throw error when there is no idToken', async () => {
				const { input } = setup();
				jest.spyOn(jwt, 'decode').mockReturnValue(null);

				const result: Promise<OauthDataDto> = strategy.getData(input);

				await expect(result).rejects.toThrow(OAuthSSOError);
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
