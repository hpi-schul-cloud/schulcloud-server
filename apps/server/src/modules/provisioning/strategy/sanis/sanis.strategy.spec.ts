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
import { EntityId, Role, RoleName, School, System } from '@shared/domain';
import { roleFactory, schoolFactory, setupEntities, systemFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
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
	let userDO: UserDO;
	let userDOwithID: UserDO;
	let userRole: Role;
	let system: System;
	let school: School;
	let schoolDto: SchoolDto;
	let schoolProvisioningDto: ProvisioningSchoolOutputDto;

	const externalId = 'testExternalId';
	const schoolUUID: UUID = new UUID('df66c8e6-cfac-40f7-b35b-0da5d8ee680e');
	const userUUID: UUID = new UUID('aef1f4fd-c323-466e-962b-a84354c0e713');

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
		userRole = roleFactory.buildWithId({ name: RoleName.ADMINISTRATOR });
		system = systemFactory.buildWithId({ alias: 'SANIS' });
		school = schoolFactory.buildWithId({ externalId });
		school.systems.add(system);
		sanisReponse = new SanisResponse({
			pid: userUUID.toHexString(),
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
						orgid: schoolUUID,
						name: 'schoolName',
						typ: 'SCHULE',
					}),
					personenstatus: 'dead',
				}),
			],
		});
		userDO = new UserDO({
			firstName: 'firstName',
			lastName: 'lastame',
			email: '',
			roleIds: [userRole.id],
			schoolId: school.id,
			externalId: userUUID.toHexString(),
		});
		schoolDto = new SchoolDto({
			id: school.id,
			name: school.name,
			externalId,
			systemIds: [system.id],
		});
		userDOwithID = { ...userDO, id: new ObjectId().toHexString() };
		schoolProvisioningDto = new ProvisioningSchoolOutputDto({
			name: school.name,
			externalId,
			systemIds: [system.id],
		});
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('apply', () => {
		const sanisParams: SanisStrategyData = {
			provisioningUrl: 'sanisProvisioningUrl',
			accessToken: 'sanisAccessToken',
			systemId: 'sanisSystemId',
		};

		beforeEach(() => {
			httpService.get.mockReturnValue(of(createAxiosResponse(sanisReponse)));
			mapper.mapSanisRoleToRoleName.mockReturnValue(RoleName.ADMINISTRATOR);
			roleRepo.findByName.mockResolvedValue(userRole);
			mapper.mapToUserDO.mockReturnValue(userDO);
			userRepo.findByExternalIdOrFail.mockResolvedValue(userDOwithID);
			userRepo.save.mockResolvedValue(userDOwithID);
			accountUc.saveAccount.mockResolvedValue();
			mapper.mapToSchoolDto.mockReturnValue(schoolProvisioningDto);
			schoolRepo.findByExternalIdOrFail.mockResolvedValue(school);
			schoolUc.saveProvisioningSchoolOutputDto.mockResolvedValue(schoolDto);
		});

		it('should apply strategy', async () => {
			const result: ProvisioningDto = await sanisStrategy.apply(sanisParams);

			expect(result.externalUserId).toEqual(userUUID.toHexString());
		});

		it('should throw error when there is no school saved', async () => {
			schoolDto.id = undefined;
			mapper.mapToUserDO.mockReturnValue(userDO);
			schoolUc.saveProvisioningSchoolOutputDto.mockResolvedValue(schoolDto);

			await expect(sanisStrategy.apply(sanisParams)).rejects.toThrow(UnprocessableEntityException);
		});
	});

	describe('getType', () => {
		it('should return type SANIS', () => {
			const retType: SystemProvisioningStrategy = sanisStrategy.getType();

			expect(retType).toEqual(SystemProvisioningStrategy.SANIS);
		});
	});

	describe('provisionSchool', () => {
		beforeEach(() => {
			mapper.mapToSchoolDto.mockReturnValue(schoolProvisioningDto);
			schoolRepo.findByExternalIdOrFail.mockResolvedValue(school);
			schoolUc.saveProvisioningSchoolOutputDto.mockResolvedValue(schoolDto);
		});

		it('should save new school', async () => {
			schoolRepo.findByExternalIdOrFail.mockRejectedValueOnce('Not Found');

			const result: SchoolDto = await sanisStrategy.provisionSchool(sanisReponse, system.id);

			expect(result).toEqual(schoolDto);
			expect(schoolProvisioningDto.id).toBeUndefined();
		});

		it('should update school', async () => {
			const result: SchoolDto = await sanisStrategy.provisionSchool(sanisReponse, system.id);

			expect(result).toEqual(schoolDto);
			expect(schoolProvisioningDto.id).toEqual(school.id);
		});
	});

	describe('provisionUser', () => {
		beforeEach(() => {
			mapper.mapSanisRoleToRoleName.mockReturnValue(RoleName.ADMINISTRATOR);
			roleRepo.findByName.mockResolvedValue(userRole);
			mapper.mapToUserDO.mockReturnValue(userDO);
			userRepo.findByExternalIdOrFail.mockResolvedValue(userDOwithID);
			userRepo.save.mockResolvedValue(userDOwithID);
			accountUc.saveAccount.mockResolvedValue();
		});

		it('should save new user', async () => {
			userRepo.findByExternalIdOrFail.mockRejectedValueOnce('Not Found');

			const result = await sanisStrategy.provisionUser(sanisReponse, system.id, school.id);

			expect(result).toEqual(userDOwithID);
			expect(userRepo.save).toHaveBeenCalledTimes(1);
			expect(accountUc.saveAccount).toHaveBeenCalledTimes(1);
		});

		it('should update user', async () => {
			const result = await sanisStrategy.provisionUser(sanisReponse, system.id, school.id);

			expect(result).toEqual(userDOwithID);
			expect(userRepo.save).toHaveBeenCalledTimes(1);
			expect(accountUc.saveAccount).not.toHaveBeenCalled();
		});

		it('should throw if no external id in provided data', async () => {
			userDO.externalId = undefined;
			mapper.mapToUserDO.mockReturnValueOnce(userDO);

			await expect(sanisStrategy.provisionUser(sanisReponse, system.id, school.id)).rejects.toThrow(
				UnprocessableEntityException
			);
		});
	});
});
