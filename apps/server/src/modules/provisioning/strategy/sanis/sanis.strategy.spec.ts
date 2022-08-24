import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { UserUc } from '@src/modules/user/uc';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SanisProvisioningStrategy, SanisStrategyData } from '@src/modules/provisioning/strategy/sanis/sanis.strategy';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import {
	SanisResponse,
	SanisResponseName,
	SanisResponseOrganisation,
	SanisResponsePersonenkontext,
	SanisRole,
} from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { of } from 'rxjs';
import { UUID } from 'bson';
import { UnprocessableEntityException } from '@nestjs/common';
import { RoleRepo, SchoolRepo } from '@shared/repo';
import { AccountUc } from '@src/modules/account/uc/account.uc';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, School, System } from '@shared/domain';
import { schoolFactory, setupEntities, systemFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { SchoolDto } from '../../../school/uc/dto/school.dto';
import { SanisResponseMapper } from './sanis-response.mapper';

const createAxiosResponse = (data: SanisResponse): AxiosResponse<SanisResponse> => ({
	data: data ?? {},
	status: 0,
	statusText: '',
	headers: {},
	config: {},
});

class SanisProvisioningStrategySpec extends SanisProvisioningStrategy {
	override async provisionSchool(data: SanisResponse, systemId: EntityId): Promise<SchoolDto> {
		return super.provisionSchool(data, systemId);
	}

	override async provisionUser(data: SanisResponse, systemId: EntityId, schoolId: EntityId): Promise<UserDO> {
		return super.provisionUser(data, systemId, schoolId);
	}
}

describe('SanisStrategy', () => {
	let module: TestingModule;
	let sanisStrategy: SanisProvisioningStrategySpec;
	let orm: MikroORM;

	let mapper: DeepMocked<SanisResponseMapper>;
	let schoolUc: DeepMocked<SchoolUc>;
	let userUc: DeepMocked<UserUc>;
	let schoolRepo: DeepMocked<SchoolRepo>;
	let userRepo: DeepMocked<UserDORepo>;
	let roleRepo: DeepMocked<RoleRepo>;
	let httpService: DeepMocked<HttpService>;
	let accountUc: DeepMocked<AccountUc>;

	let sanisReponse: SanisResponse;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				SanisProvisioningStrategySpec,
				{
					provide: SanisResponseMapper,
					useValue: createMock<SanisResponseMapper>(),
				},
				{
					provide: SchoolUc,
					useValue: createMock<SchoolUc>(),
				},
				{
					provide: UserUc,
					useValue: createMock<UserUc>(),
				},
				{
					provide: SchoolRepo,
					useValue: createMock<SchoolRepo>(),
				},
				{
					provide: UserDORepo,
					useValue: createMock<UserDORepo>(),
				},
				{
					provide: RoleRepo,
					useValue: createMock<RoleRepo>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: AccountUc,
					useValue: createMock<AccountUc>(),
				},
			],
		}).compile();

		sanisStrategy = module.get(SanisProvisioningStrategySpec);
		mapper = module.get(SanisResponseMapper);
		schoolUc = module.get(SchoolUc);
		userUc = module.get(UserUc);
		schoolRepo = module.get(SchoolRepo);
		userRepo = module.get(UserDORepo);
		roleRepo = module.get(RoleRepo);
		httpService = module.get(HttpService);
		accountUc = module.get(AccountUc);
	});

	beforeEach(() => {
		sanisReponse = new SanisResponse({
			pid: 'pid',
			person: {
				name: new SanisResponseName({
					vorname: 'Hans',
					familienname: 'Peter',
				}),
				geschlecht: 'any',
				lokalisierung: 'sn_ZW',
				vertrauensstufe: '0',
			},
			personenkontexte: [
				new SanisResponsePersonenkontext({
					ktid: new UUID(),
					rolle: SanisRole.SYSA,
					organisation: new SanisResponseOrganisation({
						orgid: new UUID(),
						name: 'orga',
						typ: 'school',
					}),
					personenstatus: 'dead',
				}),
			],
		});
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('apply', () => {
		const userUUID: UUID = new UUID('aef1f4fd-c323-466e-962b-a84354c0e713');
		const schoolUUID: UUID = new UUID('df66c8e6-cfac-40f7-b35b-0da5d8ee680e');
		const systemUUID: UUID = new UUID('bee7376a-31c3-42d3-93e3-e976f273f90d');
		const schoolDto: ProvisioningSchoolOutputDto = new ProvisioningSchoolOutputDto({
			id: 'schoolId',
			name: 'schoolName',
			externalId: userUUID.toString(),
			systemIds: [systemUUID.toString()],
		});
		const userDO: UserDO = new UserDO({
			firstName: 'firstName',
			lastName: 'lastame',
			email: '',
			roleIds: ['role'],
			schoolId: 'schoolId',
			externalId: schoolUUID.toString(),
		});
		const mockResponse: SanisResponse = new SanisResponse({
			pid: userUUID.toString(),
			person: {
				name: new SanisResponseName({
					vorname: 'firstName',
					familienname: 'lastName',
				}),
				geschlecht: 'x',
				lokalisierung: 'de-de',
				vertrauensstufe: '',
			},
			personenkontexte: [
				new SanisResponsePersonenkontext({
					ktid: new UUID(),
					rolle: SanisRole.LERN,
					organisation: new SanisResponseOrganisation({
						orgid: schoolUUID,
						name: 'schoolName',
						typ: 'SCHULE',
					}),
					personenstatus: '',
				}),
			],
		});
		const sanisParams: SanisStrategyData = {
			provisioningUrl: 'sanisProvisioningUrl',
			accessToken: 'sanisAccessToken',
			systemId: 'sanisSystemId',
		};

		beforeEach(() => {
			schoolUc.saveProvisioningSchoolOutputDto.mockResolvedValue(schoolDto);
		});

		it('should apply strategy', async () => {
			// Arrange
			httpService.get.mockReturnValue(of(createAxiosResponse(mockResponse)));
			mapper.mapToSchoolDto.mockReturnValue(schoolDto);
			mapper.mapToUserDO.mockReturnValue(userDO);

			// Act
			const result = await sanisStrategy.apply(sanisParams);

			// Assert
			expect(mapper.mapToSchoolDto).toHaveBeenCalledWith(mockResponse, sanisParams.systemId);
			expect(schoolUc.saveProvisioningSchoolOutputDto).toHaveBeenCalledWith(schoolDto);
			expect(mapper.mapToUserDO).toHaveBeenCalledWith(mockResponse, schoolDto.id, userDO.roleIds);
			expect(userUc.saveProvisioningUserOutputDto).toHaveBeenCalled();
			expect(result.externalUserId).toEqual(userDO.externalId);
		});

		it('should throw error when there is no school saved', async () => {
			// Arrange
			httpService.get.mockReturnValue(of(createAxiosResponse(mockResponse)));
			mapper.mapToUserDO.mockReturnValue(userDO);
			schoolUc.saveProvisioningSchoolOutputDto.mockResolvedValue(
				new SchoolDto({ name: 'schoolName', systemIds: [systemUUID.toString()] })
			);

			// Act & Assert
			await expect(sanisStrategy.apply({ provisioningUrl: '', accessToken: '', systemId: '' })).rejects.toThrow(
				UnprocessableEntityException
			);
		});
	});

	describe('getType', () => {
		it('should return type SANIS', () => {
			// Act
			const retType: SystemProvisioningStrategy = sanisStrategy.getType();

			// Assert
			expect(retType).toEqual(SystemProvisioningStrategy.SANIS);
		});
	});

	describe('provisionSchool', () => {
		const externalId = 'testExternalId';
		let system: System;
		let school: School;
		let schoolProvisioningDto: ProvisioningSchoolOutputDto;
		let schoolDto: SchoolDto;

		beforeEach(() => {
			system = systemFactory.buildWithId({ alias: 'SANIS' });
			school = schoolFactory.buildWithId({ externalId });
			school.systems.add(system);
			schoolProvisioningDto = new ProvisioningSchoolOutputDto({
				name: school.name,
				externalId,
				systemIds: [system.id],
			});
			schoolDto = new SchoolDto({
				id: school.id,
				name: school.name,
				externalId,
				systemIds: [system.id],
			});

			mapper.mapToSchoolDto.mockReturnValue(schoolProvisioningDto);
			schoolRepo.findByExternalIdOrFail.mockResolvedValue(school);
			schoolUc.saveProvisioningSchoolOutputDto.mockResolvedValue(schoolDto);
		});

		it('should save new school', async () => {
			// Arrange
			schoolRepo.findByExternalIdOrFail.mockRejectedValueOnce('Not Found');

			// Act
			const result: SchoolDto = await sanisStrategy.provisionSchool(sanisReponse, 'systemId');

			// Assert
			expect(schoolDto).toEqual(result);
			expect(schoolProvisioningDto.id).toBeUndefined();
		});

		it('should update school', async () => {
			// Act
			const result: SchoolDto = await sanisStrategy.provisionSchool(sanisReponse, 'systemId');

			// Assert
			expect(schoolDto).toEqual(result);
			expect(schoolProvisioningDto.id).toEqual(school.id);
		});
	});

	describe('provisionUser', () => {
		it('should save new user', async () => {});

		it('should update user', async () => {});

		it('should throw if no external id in provided data', async () => {
			// Act & Assert
			await expect(sanisStrategy.provisionUser(sanisReponse, 'systemId', 'schoolId')).rejects.toThrow(
				UnprocessableEntityException
			);
		});
	});
});
