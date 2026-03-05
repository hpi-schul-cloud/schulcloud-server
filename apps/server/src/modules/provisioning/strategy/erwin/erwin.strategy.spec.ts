import { faker } from '@faker-js/faker';
import { IdTokenExtractionFailureLoggableException } from '@modules/oauth/loggable';
import { RoleName } from '@modules/role';
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
} from '../../dto';
import { ErwinProvisioningStrategy } from './erwin.strategy';
import { ErwinRole } from '../../../role/domain';

describe('ErwinProvisioningStrategy', () => {
	let module: TestingModule;
	let sut: ErwinProvisioningStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [ErwinProvisioningStrategy],
		}).compile();

		sut = module.get(ErwinProvisioningStrategy);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getType', () => {
		describe('when called', () => {
			it('should return type ERWIN', () => {
				const result = sut.getType();

				expect(result).toEqual(SystemProvisioningStrategy.ERWIN);
			});
		});
	});

	describe('getData', () => {
		describe('when token is valid with all required fields', () => {
			const setup = () => {
				const input = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.ERWIN,
					}),
					idToken: 'erwinIdToken',
					accessToken: 'erwinAccessToken',
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return {
						sub: '550e8400-e29b-41d4-a716-446655440000',
						personExternalId: 'personExternalId',
						personFirstName: 'firstName',
						personLastName: 'lastName',
						personErwinRole: ErwinRole.LERN,
						personEmail: 'test@example.com',
						personGeburtstag: new Date('2000-01-01'),
						schuleExternalId: 'schoolExternalId',
						schuleName: 'Test School',
						schuleZugehoerigZu: 'Berlin',
						klassen: [
							{ externalId: 'classExternalId1', name: 'Class 1' },
							{ externalId: 'classExternalId2', name: 'Class 2' },
						],
					};
				});

				const expectedUser = new ExternalUserDto({
					externalId: 'personExternalId',
					erwinId: '550e8400-e29b-41d4-a716-446655440000',
					roles: [RoleName.STUDENT],
					firstName: 'firstName',
					lastName: 'lastName',
				});

				const expectedSchool = new ExternalSchoolDto({
					externalId: 'schoolExternalId',
					name: 'Test School',
					location: 'Berlin',
				});

				const expectedClasses = [
					new ExternalClassDto({ externalId: 'classExternalId1', name: 'Class 1' }),
					new ExternalClassDto({ externalId: 'classExternalId2', name: 'Class 2' }),
				];

				return { input, expectedUser, expectedSchool, expectedClasses };
			};

			it('should return mapped oauthDataDto', async () => {
				const { input, expectedUser, expectedSchool, expectedClasses } = setup();

				const result = await sut.getData(input);

				expect(result).toEqual<OauthDataDto>({
					system: input.system,
					externalUser: expectedUser,
					externalSchool: expectedSchool,
					externalClasses: expectedClasses,
				});
			});
		});

		describe('when token is valid with LEHR role', () => {
			const setup = () => {
				const input = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: faker.string.uuid(),
						provisioningStrategy: SystemProvisioningStrategy.ERWIN,
					}),
					idToken: faker.string.alphanumeric(20),
					accessToken: faker.string.alphanumeric(20),
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return {
						sub: faker.string.uuid(),
						personExternalId: faker.string.uuid(),
						personFirstName: faker.person.firstName(),
						personLastName: faker.person.lastName(),
						personErwinRole: ErwinRole.LEHR,
						personEmail: faker.internet.email(),
						personGeburtstag: faker.date.past(),
						schuleExternalId: faker.string.uuid(),
						schuleName: faker.company.name(),
						schuleZugehoerigZu: faker.location.city(),
						klassen: [],
					};
				});

				return { input };
			};

			it('should map LEHR role to TEACHER', async () => {
				const { input } = setup();

				const result = await sut.getData(input);

				expect(result.externalUser.roles).toEqual([RoleName.TEACHER]);
			});
		});

		describe('when token is valid with LEIT role', () => {
			const setup = () => {
				const input = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: faker.string.uuid(),
						provisioningStrategy: SystemProvisioningStrategy.ERWIN,
					}),
					idToken: faker.string.alphanumeric(20),
					accessToken: faker.string.alphanumeric(20),
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return {
						sub: faker.string.uuid(),
						personExternalId: faker.string.uuid(),
						personFirstName: faker.person.firstName(),
						personLastName: faker.person.lastName(),
						personErwinRole: ErwinRole.LEIT,
						personEmail: faker.internet.email(),
						personGeburtstag: faker.date.past(),
						schuleExternalId: faker.string.uuid(),
						schuleName: faker.company.name(),
						schuleZugehoerigZu: faker.location.city(),
						klassen: [],
					};
				});

				return { input };
			};

			it('should map LEIT role to ADMINISTRATOR', async () => {
				const { input } = setup();

				const result = await sut.getData(input);

				expect(result.externalUser.roles).toEqual([RoleName.ADMINISTRATOR]);
			});
		});

		describe('when token decoding returns null', () => {
			const setup = () => {
				const input = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: faker.string.uuid(),
						provisioningStrategy: SystemProvisioningStrategy.ERWIN,
					}),
					idToken: faker.string.alphanumeric(20),
					accessToken: faker.string.alphanumeric(20),
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => null);

				return { input };
			};

			it('should throw IdTokenExtractionFailureLoggableException', async () => {
				const { input } = setup();

				await expect(sut.getData(input)).rejects.toThrow(IdTokenExtractionFailureLoggableException);
			});
		});

		describe('when required field is missing in payload', () => {
			const setup = () => {
				const input = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: faker.string.uuid(),
						provisioningStrategy: SystemProvisioningStrategy.ERWIN,
					}),
					idToken: faker.string.alphanumeric(20),
					accessToken: faker.string.alphanumeric(20),
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return {
						sub: faker.string.uuid(),
						personFirstName: faker.person.firstName(),
						personLastName: faker.person.lastName(),
						personErwinRole: ErwinRole.LERN,
						personEmail: faker.internet.email(),
						personGeburtstag: faker.date.past(),
						schuleExternalId: faker.string.uuid(),
						schuleName: faker.company.name(),
						schuleZugehoerigZu: faker.location.city(),
						klassen: [],
					};
				});

				return { input };
			};

			it('should throw IdTokenExtractionFailureLoggableException', async () => {
				const { input } = setup();

				await expect(sut.getData(input)).rejects.toThrow(IdTokenExtractionFailureLoggableException);
			});
		});

		describe('when sub field is missing in payload', () => {
			const setup = () => {
				const input = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: faker.string.uuid(),
						provisioningStrategy: SystemProvisioningStrategy.ERWIN,
					}),
					idToken: faker.string.alphanumeric(20),
					accessToken: faker.string.alphanumeric(20),
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return {
						personExternalId: faker.string.uuid(),
						personFirstName: faker.person.firstName(),
						personLastName: faker.person.lastName(),
						personErwinRole: ErwinRole.LERN,
						personEmail: faker.internet.email(),
						personGeburtstag: faker.date.past(),
						schuleExternalId: faker.string.uuid(),
						schuleName: faker.company.name(),
						schuleZugehoerigZu: faker.location.city(),
						klassen: [],
					};
				});

				return { input };
			};

			it('should throw IdTokenExtractionFailureLoggableException', async () => {
				const { input } = setup();

				await expect(sut.getData(input)).rejects.toThrow(IdTokenExtractionFailureLoggableException);
			});
		});
	});
});
