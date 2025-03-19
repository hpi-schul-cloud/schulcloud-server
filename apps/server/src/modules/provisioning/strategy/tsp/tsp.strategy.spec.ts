import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IdTokenExtractionFailureLoggableException } from '@modules/oauth';
import { RoleName } from '@modules/role';
import { schoolFactory } from '@modules/school/testing';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import jwt from 'jsonwebtoken';
import {
	ExternalClassDto,
	ExternalSchoolDto,
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningSystemDto,
} from '../..';
import { TspProvisioningService } from '../../service/tsp-provisioning.service';
import { TspProvisioningStrategy } from './tsp.strategy';

describe('TspProvisioningStrategy', () => {
	let module: TestingModule;
	let sut: TspProvisioningStrategy;
	let provisioningServiceMock: DeepMocked<TspProvisioningService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspProvisioningStrategy,
				{
					provide: TspProvisioningService,
					useValue: createMock<TspProvisioningService>(),
				},
			],
		}).compile();

		sut = module.get(TspProvisioningStrategy);
		provisioningServiceMock = module.get(TspProvisioningService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getType', () => {
		describe('When called', () => {
			it('should return type TSP', () => {
				const result: SystemProvisioningStrategy = sut.getType();

				expect(result).toEqual(SystemProvisioningStrategy.TSP);
			});
		});
	});

	describe('getData', () => {
		describe('When called', () => {
			const setup = () => {
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'externalSchoolId',
						provisioningStrategy: SystemProvisioningStrategy.TSP,
					}),
					idToken: 'tspIdToken',
					accessToken: 'tspAccessToken',
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return {
						sub: 'externalUserId',
						sid: 'externalSchoolId',
						ptscListRolle: 'schueler,lehrer,admin',
						personVorname: 'firstName',
						personNachname: 'lastName',
						ptscSchuleNummer: 'externalSchoolId',
						ptscListKlasseId: 'externalClassId1,externalClassId2',
					};
				});

				const user: ExternalUserDto = new ExternalUserDto({
					externalId: 'externalUserId',
					roles: [RoleName.STUDENT, RoleName.TEACHER, RoleName.ADMINISTRATOR],
					firstName: 'firstName',
					lastName: 'lastName',
				});

				const school: ExternalSchoolDto = new ExternalSchoolDto({
					externalId: 'externalSchoolId',
				});

				const externalClass1 = new ExternalClassDto({ externalId: 'externalClassId1' });
				const externalClass2 = new ExternalClassDto({ externalId: 'externalClassId2' });
				const externalClasses = [externalClass1, externalClass2];

				return { input, user, school, externalClasses };
			};

			it('should return mapped oauthDataDto if input is valid', async () => {
				const { input, user, school, externalClasses } = setup();
				const result = await sut.getData(input);

				expect(result).toEqual<OauthDataDto>({
					system: input.system,
					externalUser: user,
					externalSchool: school,
					externalGroups: undefined,
					externalLicenses: undefined,
					externalClasses,
				});
			});
		});

		describe('When idToken is invalid', () => {
			const setup = () => {
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'externalSchoolId',
						provisioningStrategy: SystemProvisioningStrategy.TSP,
					}),
					idToken: 'invalidIdToken',
					accessToken: 'tspAccessToken',
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => null);

				return { input };
			};

			it('should throw IdTokenExtractionFailure', async () => {
				const { input } = setup();

				await expect(sut.getData(input)).rejects.toThrow(new IdTokenExtractionFailureLoggableException('sub'));
			});
		});

		describe('When payload is invalid', () => {
			const setup = () => {
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'externalSchoolId',
						provisioningStrategy: SystemProvisioningStrategy.TSP,
					}),
					idToken: 'tspIdToken',
					accessToken: 'tspAccessToken',
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return {
						sub: 'externalUserId',
						sid: 1000,
						ptscListRolle: 'lehrer,admin',
						personVorname: 'firstName',
						personNachname: 'lastName',
						ptscSchuleNummer: 'externalSchoolId',
						ptscListKlasseId: ['externalClassId1', 'externalClassId2'],
					};
				});

				return { input };
			};

			it('should throw IdTokenExtractionFailure', async () => {
				const { input } = setup();

				await expect(sut.getData(input)).rejects.toThrow(new IdTokenExtractionFailureLoggableException('sub'));
			});
		});

		describe('When roles are missing or unknown', () => {
			const setup = () => {
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'externalSchoolId',
						provisioningStrategy: SystemProvisioningStrategy.TSP,
					}),
					idToken: 'tspIdToken',
					accessToken: 'tspAccessToken',
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return {
						sub: 'externalUserId',
						ptscListRolle: 'user',
						personVorname: 'firstName',
						personNachname: 'lastName',
						ptscSchuleNummer: 'externalSchoolId',
						ptscListKlasseId: 'externalClassId1,externalClassId2',
					};
				});

				return { input };
			};

			it('should throw IdTokenExtractionFailure', async () => {
				const { input } = setup();

				await expect(sut.getData(input)).rejects.toThrow(IdTokenExtractionFailureLoggableException);
			});
		});
	});

	describe('apply', () => {
		describe('when external school is missing', () => {
			it('should throw', async () => {
				await expect(sut.apply({} as OauthDataDto)).rejects.toThrow();
			});
		});

		describe('when external classes are missing', () => {
			it('should throw', async () => {
				await expect(sut.apply({ externalSchool: {} } as OauthDataDto)).rejects.toThrow();
			});
		});

		describe('when external school and external classes are present', () => {
			const setup = () => {
				const user = userDoFactory.build();
				const school = schoolFactory.build();
				const system = new ProvisioningSystemDto({
					systemId: faker.string.uuid(),
					provisioningStrategy: SystemProvisioningStrategy.TSP,
				});
				const externalUser = new ExternalUserDto({
					externalId: faker.string.uuid(),
					roles: [RoleName.TEACHER],
					email: faker.internet.email(),
					firstName: faker.person.firstName(),
					lastName: faker.person.lastName(),
				});
				const externalSchool = new ExternalSchoolDto({ externalId: faker.string.uuid(), name: faker.word.noun() });
				const externalClasses = [];
				const data = new OauthDataDto({ system, externalUser, externalSchool, externalClasses });

				provisioningServiceMock.findSchoolOrFail.mockResolvedValueOnce(school);
				provisioningServiceMock.provisionUser.mockResolvedValueOnce(user);

				return { school, user, system, externalUser, externalSchool, externalClasses, data };
			};

			it('should search for the school', async () => {
				const { data, system, externalSchool } = setup();

				await sut.apply(data);

				expect(provisioningServiceMock.findSchoolOrFail).toHaveBeenCalledWith(system, externalSchool);
			});

			it('should provision the user', async () => {
				const { data, school } = setup();

				await sut.apply(data);

				expect(provisioningServiceMock.provisionUser).toHaveBeenCalledWith(data, school);
			});

			it('should provision the classes', async () => {
				const { data, externalClasses, user, school } = setup();

				await sut.apply(data);

				expect(provisioningServiceMock.provisionClasses).toHaveBeenCalledWith(school, externalClasses, user);
			});
		});
	});
});
