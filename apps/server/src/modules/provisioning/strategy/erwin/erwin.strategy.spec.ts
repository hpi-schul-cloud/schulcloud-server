import { createMock } from '@golevelup/ts-jest';
import { IdTokenExtractionFailureLoggableException } from '@modules/oauth';
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
import { TspProvisioningService } from '../../service/tsp-provisioning.service';
import { ErwinProvisioningStrategy } from './erwin.strategy';

describe('ErwinProvisioningStrategy', () => {
	let module: TestingModule;
	let sut: ErwinProvisioningStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ErwinProvisioningStrategy,
				{
					provide: TspProvisioningService,
					useValue: createMock<TspProvisioningService>(),
				},
			],
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
		it('should return type ERWIN', () => {
			const result = sut.getType();
			expect(result).toEqual(SystemProvisioningStrategy.ERWIN);
		});
	});

	describe('getData', () => {
		const setup = () => {
			const input = new OauthDataStrategyInputDto({
				system: new ProvisioningSystemDto({
					systemId: 'externalSchoolId',
					provisioningStrategy: SystemProvisioningStrategy.ERWIN,
				}),
				idToken: 'erwinIdToken',
				accessToken: 'erwinAccessToken',
			});

			jest.spyOn(jwt, 'decode').mockImplementation(() => {
				return {
					sub: 'externalUserId',
					erwinRole: 'schueler,lehrer,admin',
					personVorname: 'firstName',
					personNachname: 'lastName',
					erwinSchuleNummer: 'externalSchoolId',
					erwinKlasseIds: 'externalClassId1,externalClassId2',
				};
			});

			const user = new ExternalUserDto({
				externalId: 'externalUserId',
				erWInId: 'externalUserId',
				roles: [RoleName.STUDENT, RoleName.TEACHER, RoleName.ADMINISTRATOR],
				firstName: 'firstName',
				lastName: 'lastName',
			});

			const school = new ExternalSchoolDto({
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
				externalClasses,
			});
		});

		it('should throw IdTokenExtractionFailure if token is invalid', async () => {
			const input = new OauthDataStrategyInputDto({
				system: new ProvisioningSystemDto({
					systemId: 'externalSchoolId',
					provisioningStrategy: SystemProvisioningStrategy.ERWIN,
				}),
				idToken: 'invalidIdToken',
				accessToken: 'erwinAccessToken',
			});
			jest.spyOn(jwt, 'decode').mockImplementation(() => null);
			await expect(sut.getData(input)).rejects.toThrow(new IdTokenExtractionFailureLoggableException('sub'));
		});

		it('should throw IdTokenExtractionFailure if roles are missing or unknown', async () => {
			const input = new OauthDataStrategyInputDto({
				system: new ProvisioningSystemDto({
					systemId: 'externalSchoolId',
					provisioningStrategy: SystemProvisioningStrategy.ERWIN,
				}),
				idToken: 'erwinIdToken',
				accessToken: 'erwinAccessToken',
			});
			jest.spyOn(jwt, 'decode').mockImplementation(() => {
				return {
					sub: 'externalUserId',
					erwinRole: '',
					personVorname: 'firstName',
					personNachname: 'lastName',
					erwinSchuleNummer: 'externalSchoolId',
					erwinKlasseIds: 'externalClassId1,externalClassId2',
				};
			});
			await expect(sut.getData(input)).rejects.toThrow(IdTokenExtractionFailureLoggableException);
		});

		it('should throw IdTokenExtractionFailure if erwinRole contains only unknown roles', async () => {
			const input = new OauthDataStrategyInputDto({
				system: new ProvisioningSystemDto({
					systemId: 'externalSchoolId',
					provisioningStrategy: SystemProvisioningStrategy.ERWIN,
				}),
				idToken: 'erwinIdToken',
				accessToken: 'erwinAccessToken',
			});
			jest.spyOn(jwt, 'decode').mockImplementation(() => {
				return {
					sub: 'externalUserId',
					erwinRole: 'unknownrole1,unknownrole2',
					personVorname: 'firstName',
					personNachname: 'lastName',
					erwinSchuleNummer: 'externalSchoolId',
					erwinKlasseIds: 'externalClassId1,externalClassId2',
				};
			});
			await expect(sut.getData(input)).rejects.toThrow(IdTokenExtractionFailureLoggableException);
		});

		it('should throw IdTokenExtractionFailure if roles property is missing in payload', async () => {
			const input = new OauthDataStrategyInputDto({
				system: new ProvisioningSystemDto({
					systemId: 'externalSchoolId',
					provisioningStrategy: SystemProvisioningStrategy.ERWIN,
				}),
				idToken: 'erwinIdToken',
				accessToken: 'erwinAccessToken',
			});
			jest.spyOn(jwt, 'decode').mockImplementation(() => {
				return {
					sub: 'externalUserId',
					// erwinRole is missing
					personVorname: 'firstName',
					personNachname: 'lastName',
					erwinSchuleNummer: 'externalSchoolId',
					erwinKlasseIds: 'externalClassId1,externalClassId2',
				};
			});
			await expect(sut.getData(input)).rejects.toThrow(IdTokenExtractionFailureLoggableException);
		});
	});
});
