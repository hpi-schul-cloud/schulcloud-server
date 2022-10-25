import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';
import { SchoolUc } from '@src/modules/school/uc/school.uc';
import { SchoolRepo } from '@shared/repo';
import { roleFactory, schoolFactory, setupEntities, systemFactory } from '@shared/testing';
import { SanisSchoolService } from '@src/modules/provisioning/strategy/sanis/service/sanis-school.service';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { UUID } from 'bson';
import { Role, RoleName, School, System } from '@shared/domain';
import {
	SanisResponse,
	SanisResponseName,
	SanisResponseOrganisation,
	SanisResponsePersonenkontext,
	SanisRole,
} from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';

describe('SanisSchoolService', () => {
	let module: TestingModule;
	let sanisSchoolService: SanisSchoolService;
	let orm: MikroORM;

	let mapper: DeepMocked<SanisResponseMapper>;
	let schoolUc: DeepMocked<SchoolUc>;
	let schoolRepo: DeepMocked<SchoolRepo>;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				SanisSchoolService,
				{
					provide: SanisResponseMapper,
					useValue: createMock<SanisResponseMapper>(),
				},
				{
					provide: SchoolUc,
					useValue: createMock<SchoolUc>(),
				},
				{
					provide: SchoolRepo,
					useValue: createMock<SchoolRepo>(),
				},
			],
		}).compile();

		sanisSchoolService = module.get(SanisSchoolService);
		mapper = module.get(SanisResponseMapper);
		schoolUc = module.get(SchoolUc);
		schoolRepo = module.get(SchoolRepo);
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
					rolle: SanisRole.SYSA,
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
		const schoolDto: SchoolDto = new SchoolDto({
			id: school.id,
			name: school.name,
			externalId,
			systemIds: [system.id],
		});
		const schoolProvisioningDto: ProvisioningSchoolOutputDto = new ProvisioningSchoolOutputDto({
			name: school.name,
			externalId,
			systemIds: [system.id],
		});

		mapper.mapSanisRoleToRoleName.mockReturnValue(RoleName.ADMINISTRATOR);
		mapper.mapToUserDO.mockReturnValue(userDO);
		mapper.mapToSchoolDto.mockReturnValue(schoolProvisioningDto);
		schoolRepo.findByExternalId.mockResolvedValue(school);
		schoolUc.saveProvisioningSchoolOutputDto.mockResolvedValue(schoolDto);

		return {
			system,
			school,
			sanisResponse,
			schoolDto,
			schoolProvisioningDto,
		};
	};

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('provisionSchool', () => {
		it('should call the school uc', async () => {
			const { sanisResponse, system, schoolProvisioningDto } = setup();

			await sanisSchoolService.provisionSchool(sanisResponse, system.id);

			expect(schoolUc.saveProvisioningSchoolOutputDto).toHaveBeenCalledWith(schoolProvisioningDto);
		});

		it('should save new school', async () => {
			const { sanisResponse, system, schoolDto } = setup();
			schoolRepo.findByExternalId.mockResolvedValue(null);

			const result: SchoolDto = await sanisSchoolService.provisionSchool(sanisResponse, system.id);

			expect(result).toEqual(schoolDto);
			expect(schoolUc.saveProvisioningSchoolOutputDto).toHaveBeenCalledWith(expect.objectContaining({ id: undefined }));
		});

		it('should update school', async () => {
			const { sanisResponse, system, schoolDto, schoolProvisioningDto, school } = setup();

			const result: SchoolDto = await sanisSchoolService.provisionSchool(sanisResponse, system.id);

			expect(result).toEqual(schoolDto);
			expect(schoolProvisioningDto.id).toEqual(school.id);
		});
	});
});
