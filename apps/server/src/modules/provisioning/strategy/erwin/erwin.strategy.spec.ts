import { faker } from '@faker-js/faker';
import { IdTokenExtractionFailureLoggableException } from '@modules/oauth';
import { RoleName } from '@modules/role';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import * as classValidator from 'class-validator';
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
import { ErwinRole, MappedSvsRolle } from './enums/rolle.enum';
import { ErwinKlassePayload } from './erwin.klasse.payload';

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
						person: {
							externalId: 'personExternalId',
							firstName: 'firstName',
							lastName: 'lastName',
							role: ErwinRole.LERN,
							email: 'test@example.com',
							geburtstag: new Date('2000-01-01'),
						},
						schule: {
							externalId: 'schoolExternalId',
							name: 'Test School',
							zugehoerigZu: 'Berlin',
						},
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

				const validateSpy = jest.spyOn(classValidator, 'validate').mockResolvedValueOnce([]);

				return { input, expectedUser, expectedSchool, expectedClasses, validateSpy };
			};

			it('should return mapped oauthDataDto', async () => {
				const { input, expectedUser, expectedSchool, expectedClasses, validateSpy } = setup();

				const result = await sut.getData(input);

				expect(result).toEqual<OauthDataDto>({
					system: input.system,
					externalUser: expectedUser,
					externalSchool: expectedSchool,
					externalClasses: expectedClasses,
				});

				validateSpy.mockRestore();
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
						person: {
							externalId: faker.string.uuid(),
							firstName: faker.person.firstName(),
							lastName: faker.person.lastName(),
							role: ErwinRole.LEHR,
							email: faker.internet.email(),
							geburtstag: faker.date.past(),
						},
						schule: {
							externalId: faker.string.uuid(),
							name: faker.company.name(),
							zugehoerigZu: faker.location.city(),
						},
						klassen: [],
					};
				});

				const validateSpy = jest.spyOn(classValidator, 'validate').mockResolvedValueOnce([]);

				return { input, validateSpy };
			};

			it('should map LEHR role to TEACHER', async () => {
				const { input, validateSpy } = setup();

				const result = await sut.getData(input);

				expect(result.externalUser.roles).toEqual([RoleName.TEACHER]);

				validateSpy.mockRestore();
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
						person: {
							externalId: faker.string.uuid(),
							firstName: faker.person.firstName(),
							lastName: faker.person.lastName(),
							role: ErwinRole.LEIT,
							email: faker.internet.email(),
							geburtstag: faker.date.past(),
						},
						schule: {
							externalId: faker.string.uuid(),
							name: faker.company.name(),
							zugehoerigZu: faker.location.city(),
						},
						klassen: [],
					};
				});

				const validateSpy = jest.spyOn(classValidator, 'validate').mockResolvedValueOnce([]);

				return { input, validateSpy };
			};

			it('should map LEIT role to ADMINISTRATOR', async () => {
				const { input, validateSpy } = setup();

				const result = await sut.getData(input);

				expect(result.externalUser.roles).toEqual([RoleName.ADMINISTRATOR]);

				validateSpy.mockRestore();
			});
		});

		describe('when token is valid with MappedSvsRolle USER role', () => {
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
						person: {
							externalId: faker.string.uuid(),
							firstName: faker.person.firstName(),
							lastName: faker.person.lastName(),
							role: MappedSvsRolle.USER,
							email: faker.internet.email(),
							geburtstag: faker.date.past(),
						},
						schule: {
							externalId: faker.string.uuid(),
							name: faker.company.name(),
							zugehoerigZu: faker.location.city(),
						},
						klassen: [],
					};
				});

				const validateSpy = jest.spyOn(classValidator, 'validate').mockResolvedValueOnce([]);

				return { input, validateSpy };
			};

			it('should map USER role to USER', async () => {
				const { input, validateSpy } = setup();

				const result = await sut.getData(input);

				expect(result.externalUser.roles).toEqual([RoleName.USER]);

				validateSpy.mockRestore();
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
						person: {
							firstName: faker.person.firstName(),
							lastName: faker.person.lastName(),
							role: ErwinRole.LERN,
							email: faker.internet.email(),
							geburtstag: faker.date.past(),
						},
						schule: {
							externalId: faker.string.uuid(),
							name: faker.company.name(),
							zugehoerigZu: faker.location.city(),
						},
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
						person: {
							externalId: faker.string.uuid(),
							firstName: faker.person.firstName(),
							lastName: faker.person.lastName(),
							role: ErwinRole.LERN,
							email: faker.internet.email(),
							geburtstag: faker.date.past(),
						},
						schule: {
							externalId: faker.string.uuid(),
							name: faker.company.name(),
							zugehoerigZu: faker.location.city(),
						},
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

		describe('when erwinId (sub) is empty string after extraction', () => {
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
						sub: '',
						person: {
							externalId: faker.string.uuid(),
							firstName: faker.person.firstName(),
							lastName: faker.person.lastName(),
							role: ErwinRole.LERN,
							email: faker.internet.email(),
							geburtstag: faker.date.past(),
						},
						schule: {
							externalId: faker.string.uuid(),
							name: faker.company.name(),
							zugehoerigZu: faker.location.city(),
						},
						klassen: [],
					};
				});

				return { input };
			};

			it('should throw IdTokenExtractionFailureLoggableException for person.sub', async () => {
				const { input } = setup();

				await expect(sut.getData(input)).rejects.toThrow(IdTokenExtractionFailureLoggableException);
			});
		});

		describe('when erwinId is falsy after validation passes', () => {
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
						sub: '',
						person: {
							externalId: faker.string.uuid(),
							firstName: faker.person.firstName(),
							lastName: faker.person.lastName(),
							role: ErwinRole.LERN,
							email: faker.internet.email(),
							geburtstag: faker.date.past(),
						},
						schule: {
							externalId: faker.string.uuid(),
							name: faker.company.name(),
							zugehoerigZu: faker.location.city(),
						},
						klassen: [],
					};
				});

				const validateSpy = jest.spyOn(classValidator, 'validate').mockResolvedValueOnce([]);

				return { input, validateSpy };
			};

			it('should throw IdTokenExtractionFailureLoggableException for person.sub', async () => {
				const { input, validateSpy } = setup();

				await expect(sut.getData(input)).rejects.toThrow(IdTokenExtractionFailureLoggableException);

				validateSpy.mockRestore();
			});
		});

		describe('when token contains klassen with ErwinKlassePayload data', () => {
			const setup = () => {
				const klassePayload1 = new ErwinKlassePayload('class-ext-id-1', 'Klasse 5a');
				const klassePayload2 = new ErwinKlassePayload('class-ext-id-2', 'Klasse 5b');

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
						person: {
							externalId: faker.string.uuid(),
							firstName: faker.person.firstName(),
							lastName: faker.person.lastName(),
							role: ErwinRole.LERN,
							email: faker.internet.email(),
							geburtstag: faker.date.past(),
						},
						schule: {
							externalId: faker.string.uuid(),
							name: faker.company.name(),
							zugehoerigZu: faker.location.city(),
						},
						klassen: [klassePayload1, klassePayload2],
					};
				});

				const validateSpy = jest.spyOn(classValidator, 'validate').mockResolvedValueOnce([]);

				return { input, klassePayload1, klassePayload2, validateSpy };
			};

			it('should map ErwinKlassePayload to ExternalClassDto correctly', async () => {
				const { input, klassePayload1, klassePayload2, validateSpy } = setup();

				const result = await sut.getData(input);

				expect(result.externalClasses).toHaveLength(2);
				expect(result.externalClasses).toEqual([
					new ExternalClassDto({ externalId: klassePayload1.externalId, name: klassePayload1.name }),
					new ExternalClassDto({ externalId: klassePayload2.externalId, name: klassePayload2.name }),
				]);

				validateSpy.mockRestore();
			});
		});
	});

	describe('apply', () => {
		describe('when called', () => {
			it('should throw NotImplementedException', () => {
				expect(() => sut.apply()).toThrow(NotImplementedException);
			});
		});
	});
});
