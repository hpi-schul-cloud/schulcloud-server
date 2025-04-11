import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SchulconnexResponse, SchulconnexRestClient } from '@infra/schulconnex-client';
import { schulconnexResponseFactory } from '@infra/schulconnex-client/testing';
import { RoleName } from '@modules/role';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { SystemEntity } from '@modules/system/repo';
import { systemEntityFactory, systemFactory } from '@modules/system/testing';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { ImportUser } from '../entity';
import { UserImportSchoolExternalIdMissingLoggableException } from '../loggable';
import { importUserFactory } from '../testing';
import { SchulconnexFetchImportUsersService } from './schulconnex-fetch-import-users.service';

describe(SchulconnexFetchImportUsersService.name, () => {
	let module: TestingModule;
	let service: SchulconnexFetchImportUsersService;

	let schulconnexRestClient: DeepMocked<SchulconnexRestClient>;
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [User] })],
			providers: [
				SchulconnexFetchImportUsersService,
				{
					provide: SchulconnexRestClient,
					useValue: createMock<SchulconnexRestClient>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexFetchImportUsersService);
		schulconnexRestClient = module.get(SchulconnexRestClient);
		userService = module.get(UserService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const createImportUser = (
		externalUserData: SchulconnexResponse,
		school: SchoolEntity,
		system: SystemEntity
	): ImportUser =>
		importUserFactory.build({
			system,
			school,
			ldapDn: `uid=${externalUserData.person.name.vorname}.${externalUserData.person.name.familienname}.${externalUserData.pid},`,
			externalId: externalUserData.pid,
			firstName: externalUserData.person.name.vorname,
			preferredName: externalUserData.person.name.rufname,
			lastName: externalUserData.person.name.familienname,
			email: `${externalUserData.person.name.vorname}.${externalUserData.person.name.familienname}.${externalUserData.pid}@schul-cloud.org`,
			roleNames: [RoleName.ADMINISTRATOR],
			classNames: undefined,
			externalRoleNames: ['admin'],
		});

	describe('getData', () => {
		describe('when fetching the data', () => {
			const setup = () => {
				const externalUserData = schulconnexResponseFactory.build();
				const systemEntity = systemEntityFactory.buildWithId();
				const system = systemFactory.build({ id: systemEntity.id });
				const school = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
					externalId: 'externalSchoolId',
				});
				const importUser = createImportUser(externalUserData, school, systemEntity);

				schulconnexRestClient.getPersonenInfo.mockResolvedValueOnce([externalUserData]);

				return {
					school,
					system,
					importUser,
				};
			};

			it('should call the schulconnex rest client', async () => {
				const { school, system } = setup();

				await service.getData(school, system);

				expect(schulconnexRestClient.getPersonenInfo).toHaveBeenCalledWith({
					vollstaendig: ['personen', 'personenkontexte', 'organisationen', 'gruppen'],
					'organisation.id': school.externalId,
				});
			});

			it('should return import users', async () => {
				const { school, system } = setup();

				const result = await service.getData(school, system);

				expect(result).toHaveLength(1);
			});
		});

		describe('when the school has no external id', () => {
			const setup = () => {
				const system = systemFactory.build();
				const school = schoolEntityFactory.buildWithId({
					externalId: undefined,
				});

				return {
					school,
					system,
				};
			};

			it('should throw an error', async () => {
				const { school, system } = setup();

				await expect(service.getData(school, system)).rejects.toThrow(
					UserImportSchoolExternalIdMissingLoggableException
				);
			});
		});
	});

	describe('filterAlreadyMigratedUser', () => {
		describe('when the user was not migrated yet', () => {
			const setup = () => {
				const externalUserData = schulconnexResponseFactory.build();
				const systemEntity = systemEntityFactory.buildWithId();
				const system = systemFactory.build({ id: systemEntity.id });
				const school = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
					externalId: 'externalSchoolId',
				});
				const importUser = createImportUser(externalUserData, school, systemEntity);
				const migratedUser = userDoFactory.build({ externalId: externalUserData.pid });
				userService.findByExternalId.mockResolvedValueOnce(null);

				return {
					system,
					importUsers: [importUser],
					migratedUser,
				};
			};

			it('should return the import users', async () => {
				const { system, importUsers } = setup();

				const result = await service.filterAlreadyMigratedUser(importUsers, system);

				expect(result).toHaveLength(1);
			});
		});

		describe('when the user already was migrated', () => {
			const setup = () => {
				const externalUserData = schulconnexResponseFactory.build();
				const systemEntity = systemEntityFactory.buildWithId();
				const system = systemFactory.build({ id: systemEntity.id });
				const school = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
					externalId: 'externalSchoolId',
				});
				const importUser = createImportUser(externalUserData, school, systemEntity);
				const migratedUser = userDoFactory.build({ externalId: externalUserData.pid });
				userService.findByExternalId.mockResolvedValueOnce(migratedUser);

				return {
					system,
					importUsers: [importUser],
				};
			};

			it('should return an empty array', async () => {
				const { system, importUsers } = setup();

				const result = await service.filterAlreadyMigratedUser(importUsers, system);

				expect(result).toHaveLength(0);
			});
		});
	});
});
