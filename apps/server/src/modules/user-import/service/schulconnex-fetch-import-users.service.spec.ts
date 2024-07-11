import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { SchulconnexResponse, schulconnexResponseFactory, SchulconnexRestClient } from '@infra/schulconnex-client';
import type { System } from '@modules/system';
import { SystemEntity } from '@modules/system/entity';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject';
import { ImportUser, SchoolEntity } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import {
	importUserFactory,
	schoolEntityFactory,
	setupEntities,
	systemEntityFactory,
	systemFactory,
	userDoFactory,
} from '@shared/testing';
import { UserImportSchoolExternalIdMissingLoggableException } from '../loggable';
import { SchulconnexFetchImportUsersService } from './schulconnex-fetch-import-users.service';

describe(SchulconnexFetchImportUsersService.name, () => {
	let module: TestingModule;
	let service: SchulconnexFetchImportUsersService;

	let schulconnexRestClient: DeepMocked<SchulconnexRestClient>;
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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
			lastName: externalUserData.person.name.familienname,
			email: `${externalUserData.person.name.vorname}.${externalUserData.person.name.familienname}.${externalUserData.pid}@schul-cloud.org`,
			roleNames: [RoleName.ADMINISTRATOR],
			classNames: undefined,
		});

	describe('getData', () => {
		describe('when fetching the data', () => {
			const setup = () => {
				const externalUserData: SchulconnexResponse = schulconnexResponseFactory.build();
				const system: System = systemFactory.build();
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId();
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [systemEntity],
					externalId: 'externalSchoolId',
				});
				const importUser: ImportUser = createImportUser(externalUserData, school, systemEntity);

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

				const result: ImportUser[] = await service.getData(school, system);

				expect(result).toHaveLength(1);
			});
		});

		describe('when the school has no external id', () => {
			const setup = () => {
				const system: System = systemFactory.build();
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
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
				const externalUserData: SchulconnexResponse = schulconnexResponseFactory.build();
				const system: SystemEntity = systemEntityFactory.buildWithId();
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [system],
					externalId: 'externalSchoolId',
				});
				const importUser: ImportUser = createImportUser(externalUserData, school, system);
				const migratedUser: UserDO = userDoFactory.build({ externalId: externalUserData.pid });
				userService.findByExternalId.mockResolvedValueOnce(null);

				return {
					systemId: system.id,
					importUsers: [importUser],
					migratedUser,
				};
			};

			it('should return the import users', async () => {
				const { systemId, importUsers } = setup();

				const result: ImportUser[] = await service.filterAlreadyMigratedUser(importUsers, systemId);

				expect(result).toHaveLength(1);
			});
		});

		describe('when the user already was migrated', () => {
			const setup = () => {
				const externalUserData: SchulconnexResponse = schulconnexResponseFactory.build();
				const system: SystemEntity = systemEntityFactory.buildWithId();
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [system],
					externalId: 'externalSchoolId',
				});
				const importUser: ImportUser = createImportUser(externalUserData, school, system);
				const migratedUser: UserDO = userDoFactory.build({ externalId: externalUserData.pid });
				userService.findByExternalId.mockResolvedValueOnce(migratedUser);

				return {
					systemId: system.id,
					importUsers: [importUser],
				};
			};

			it('should return an empty array', async () => {
				const { systemId, importUsers } = setup();

				const result: ImportUser[] = await service.filterAlreadyMigratedUser(importUsers, systemId);

				expect(result).toHaveLength(0);
			});
		});
	});
});
