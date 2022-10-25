import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	SanisResponse,
	SanisResponseName,
	SanisResponseOrganisation,
	SanisResponsePersonenkontext,
	SanisRole,
} from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { UUID } from 'bson';
import { UnprocessableEntityException } from '@nestjs/common';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, RoleName, School, System } from '@shared/domain';
import { roleFactory, schoolFactory, setupEntities, systemFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { SanisUserService } from '@src/modules/provisioning/strategy/sanis/service/sanis-user.service';
import { SanisResponseMapper } from '@src/modules/provisioning/strategy/sanis/sanis-response.mapper';
import { RoleRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { AccountUc } from '@src/modules/account/uc/account.uc';

describe('SanisUserService', () => {
	let module: TestingModule;
	let sanisUserService: SanisUserService;
	let orm: MikroORM;

	let mapper: DeepMocked<SanisResponseMapper>;
	let roleRepo: DeepMocked<RoleRepo>;
	let userRepo: DeepMocked<UserDORepo>;
	let accountUc: DeepMocked<AccountUc>;

	beforeAll(async () => {
		orm = await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				SanisUserService,
				{
					provide: SanisResponseMapper,
					useValue: createMock<SanisResponseMapper>(),
				},
				{
					provide: RoleRepo,
					useValue: createMock<RoleRepo>(),
				},
				{
					provide: UserDORepo,
					useValue: createMock<UserDORepo>(),
				},
				{
					provide: AccountUc,
					useValue: createMock<AccountUc>(),
				},
			],
		}).compile();

		sanisUserService = module.get(SanisUserService);
		mapper = module.get(SanisResponseMapper);
		roleRepo = module.get(RoleRepo);
		userRepo = module.get(UserDORepo);
		accountUc = module.get(AccountUc);
	});

	const setup = () => {
		const schoolUUID: UUID = new UUID('df66c8e6-cfac-40f7-b35b-0da5d8ee680e');
		const userUUID: UUID = new UUID('aef1f4fd-c323-466e-962b-a84354c0e713');
		const userRole: Role = roleFactory.buildWithId({ name: RoleName.ADMINISTRATOR });
		const system: System = systemFactory.buildWithId({ alias: 'SANIS' });
		const school: School = schoolFactory.buildWithId({ externalId: 'testExternalId' });
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
		const userDOwithID: UserDO = { ...userDO, id: new ObjectId().toHexString() };

		mapper.mapSanisRoleToRoleName.mockReturnValue(RoleName.ADMINISTRATOR);
		roleRepo.findByName.mockResolvedValue(userRole);
		mapper.mapToUserDO.mockReturnValue(userDO);
		userRepo.findByExternalId.mockResolvedValue(userDOwithID);
		userRepo.save.mockResolvedValue(userDOwithID);
		accountUc.saveAccount.mockResolvedValue();

		return {
			schoolUUID,
			userRole,
			userUUID,
			system,
			school,
			sanisResponse,
			userDO,
			userDOwithID,
		};
	};

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('provisionUser', () => {
		it('should save new user', async () => {
			const { sanisResponse, system, school, userDOwithID } = setup();
			userRepo.findByExternalId.mockResolvedValue(null);

			const result = await sanisUserService.provisionUser(sanisResponse, system.id, school.id);

			expect(result).toEqual(userDOwithID);
			expect(userRepo.save).toHaveBeenCalledTimes(1);
			expect(accountUc.saveAccount).toHaveBeenCalledTimes(1);
		});

		it('should update user', async () => {
			const { sanisResponse, system, school, userDOwithID } = setup();

			const result = await sanisUserService.provisionUser(sanisResponse, system.id, school.id);

			expect(result).toEqual(userDOwithID);
			expect(userRepo.save).toHaveBeenCalledTimes(1);
			expect(accountUc.saveAccount).not.toHaveBeenCalled();
		});

		it('should throw if no external id in provided data', async () => {
			const { sanisResponse, system, school, userDO } = setup();
			userDO.externalId = undefined;
			mapper.mapToUserDO.mockReturnValueOnce(userDO);

			const provisionUser = () => sanisUserService.provisionUser(sanisResponse, system.id, school.id);

			await expect(provisionUser).rejects.toThrow(UnprocessableEntityException);
		});
	});
});
