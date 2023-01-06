import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, RoleName, School, System } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { roleFactory, schoolFactory, setupEntities, systemFactory } from '@shared/testing';
import { ProvisioningSchoolOutputDto } from '@src/modules/provisioning/dto/provisioning-school-output.dto';
import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';
import {
	SanisResponse,
	SanisResponseName,
	SanisResponseOrganisation,
	SanisResponsePersonenkontext,
	SanisRole,
} from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { SanisSchoolService } from '@src/modules/provisioning/strategy/sanis/service/sanis-school.service';
import { SchoolService } from '@src/modules/school/service/school.service';
import { UUID } from 'bson';
import { SchoolDO } from '@shared/domain/domainobject/school.do';

describe('SanisSchoolService', () => {
	let module: TestingModule;
	let sanisSchoolService: SanisSchoolService;
	let orm: MikroORM;

	let mapper: DeepMocked<SanisResponseMapper>;
	let schoolService: DeepMocked<SchoolService>;

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
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		sanisSchoolService = module.get(SanisSchoolService);
		mapper = module.get(SanisResponseMapper);
		schoolService = module.get(SchoolService);
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
					email: 'test@te.st',
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
		const schoolDO: SchoolDO = new SchoolDO({
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

		mapper.mapSanisRoleToRoleName.mockReturnValue(RoleName.ADMINISTRATOR);
		mapper.mapToUserDO.mockReturnValue(userDO);
		mapper.mapToSchoolDto.mockReturnValue(schoolProvisioningDto);
		schoolService.getSchoolByExternalId.mockResolvedValue(schoolDO);
		schoolService.saveProvisioningSchoolOutputDto.mockResolvedValue(schoolDO);

		return {
			system,
			school,
			sanisResponse,
			schoolDO,
			schoolProvisioningDto,
		};
	};

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	describe('provisionSchool', () => {
		it('should call the school uc', async () => {
			const { sanisResponse, system, schoolProvisioningDto } = setup();

			await sanisSchoolService.provisionSchool(sanisResponse, system.id);

			expect(schoolService.saveProvisioningSchoolOutputDto).toHaveBeenCalledWith(schoolProvisioningDto);
		});

		it('should save new school', async () => {
			const { sanisResponse, system, schoolDO } = setup();
			schoolService.getSchoolByExternalId.mockResolvedValue(null);

			const result: SchoolDO = await sanisSchoolService.provisionSchool(sanisResponse, system.id);

			expect(result).toEqual(schoolDO);
			expect(schoolService.saveProvisioningSchoolOutputDto).toHaveBeenCalledWith(
				expect.objectContaining({ id: undefined })
			);
		});

		it('should update school', async () => {
			const { sanisResponse, system, schoolDO, schoolProvisioningDto, school } = setup();

			const result: SchoolDO = await sanisSchoolService.provisionSchool(sanisResponse, system.id);

			expect(result).toEqual(schoolDO);
			expect(schoolProvisioningDto.id).toEqual(school.id);
		});
	});
});
