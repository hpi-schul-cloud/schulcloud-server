import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
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
import { InternalServerErrorException } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, RoleName, School, System } from '@shared/domain';
import { roleFactory, schoolFactory, setupEntities, systemFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { SanisSchoolService } from '@src/modules/provisioning/strategy/sanis/service/sanis-school.service';
import { SanisUserService } from '@src/modules/provisioning/strategy/sanis/service/sanis-user.service';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SanisResponseMapper } from './sanis-response.mapper';

const createAxiosResponse = (data: SanisResponse): AxiosResponse<SanisResponse> => ({
	data: data ?? {},
	status: 0,
	statusText: '',
	headers: {},
	config: {},
});

describe('SanisStrategy', () => {
	let module: TestingModule;
	let sanisStrategy: SanisProvisioningStrategy;
	let orm: MikroORM;

	let mapper: DeepMocked<SanisResponseMapper>;
	let sanisSchoolService: DeepMocked<SanisSchoolService>;
	let sanisUserService: DeepMocked<SanisUserService>;
	let httpService: DeepMocked<HttpService>;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				SanisProvisioningStrategy,
				{
					provide: SanisResponseMapper,
					useValue: createMock<SanisResponseMapper>(),
				},
				{
					provide: SanisSchoolService,
					useValue: createMock<SanisSchoolService>(),
				},
				{
					provide: SanisUserService,
					useValue: createMock<SanisUserService>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();

		sanisStrategy = module.get(SanisProvisioningStrategy);
		mapper = module.get(SanisResponseMapper);
		sanisSchoolService = module.get(SanisSchoolService);
		sanisUserService = module.get(SanisUserService);
		httpService = module.get(HttpService);
	});

	const setup = () => {
		const externalId = 'testExternalId';
		const schoolUUID: UUID = new UUID('df66c8e6-cfac-40f7-b35b-0da5d8ee680e');
		const userUUID: UUID = new UUID('aef1f4fd-c323-466e-962b-a84354c0e713');
		const userRole: Role = roleFactory.buildWithId({ name: RoleName.ADMINISTRATOR });
		const system: System = systemFactory.buildWithId({ alias: 'SANIS' });
		const school: School = schoolFactory.buildWithId({ externalId });
		school.systems.add(system);
		const sanisResponse: SanisResponse = new SanisResponse({
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
					id: new UUID(),
					rolle: SanisRole.LEIT,
					organisation: new SanisResponseOrganisation({
						id: schoolUUID,
						name: 'schoolName',
						typ: 'SCHULE',
					}),
					personenstatus: 'dead',
				}),
			],
		});
		const userDO: UserDO = new UserDO({
			firstName: 'firstName',
			lastName: 'lastame',
			email: '',
			roleIds: [userRole.id],
			schoolId: school.id,
			externalId: userUUID.toHexString(),
		});
		const schoolDo: SchoolDO = new SchoolDO({
			id: school.id,
			name: school.name,
			externalId,
			systems: [system.id],
		});
		const schoolProvisioningDto: ProvisioningSchoolOutputDto = new ProvisioningSchoolOutputDto({
			name: school.name,
			externalId,
			systemIds: [system.id],
		});

		httpService.get.mockReturnValue(of(createAxiosResponse(sanisResponse)));
		mapper.mapSanisRoleToRoleName.mockReturnValue(RoleName.ADMINISTRATOR);
		mapper.mapToUserDO.mockReturnValue(userDO);
		mapper.mapToSchoolDto.mockReturnValue(schoolProvisioningDto);
		sanisSchoolService.provisionSchool.mockResolvedValue(schoolDo);
		sanisUserService.provisionUser.mockResolvedValue(userDO);

		return {
			userUUID,
			schoolDo,
			sanisResponse,
		};
	};

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

		it('should return users UUID', async () => {
			const { userUUID } = setup();

			const result: ProvisioningDto = await sanisStrategy.apply(sanisParams);

			expect(result.externalUserId).toEqual(userUUID.toHexString());
		});

		it('should throw error when there is no school saved', async () => {
			const { schoolDo } = setup();
			schoolDo.id = undefined;

			const apply = () => sanisStrategy.apply(sanisParams);

			await expect(apply()).rejects.toThrow(InternalServerErrorException);
		});
	});

	describe('getType', () => {
		it('should return type SANIS', () => {
			const retType: SystemProvisioningStrategy = sanisStrategy.getType();

			expect(retType).toEqual(SystemProvisioningStrategy.SANIS);
		});
	});
});
