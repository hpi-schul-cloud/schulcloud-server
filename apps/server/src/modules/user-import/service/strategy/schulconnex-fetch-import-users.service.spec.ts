import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SanisResponse, schulconnexResponseFactory, SchulconnexRestClient } from '@infra/schulconnex-client';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject';
import { ImportUser, SchoolEntity, SystemEntity } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import {
	importUserFactory,
	schoolEntityFactory,
	setupEntities,
	systemEntityFactory,
	userDoFactory,
} from '@shared/testing';
import { UserImportSchoolExternalIdMissingLoggableException } from '../../loggable';
import { SchulconnexFetchImportUsersService } from './schulconnex-fetch-import-users.service';

describe(SchulconnexFetchImportUsersService.name, () => {
	let module: TestingModule;
	let service: SchulconnexFetchImportUsersService;

	let schulconnexRestClient: DeepMocked<SchulconnexRestClient>;
	let userService: DeepMocked<UserService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
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

	describe('getData', () => {
		describe('when fetching the data', () => {
			const createImportUser = (
				externalUserData: SanisResponse,
				school: SchoolEntity,
				system: SystemEntity
			): ImportUser =>
				importUserFactory.build({
					system,
					school,
					ldapDn: `uid=${externalUserData.person.name.vorname}.${externalUserData.person.name.familienname},`,
					externalId: externalUserData.pid,
					firstName: externalUserData.person.name.vorname,
					lastName: externalUserData.person.name.familienname,
					email: '',
					roleNames: [RoleName.ADMINISTRATOR],
					classNames: undefined,
				});

			describe('when the user was not migrated yet', () => {
				const setup = () => {
					const externalUserData: SanisResponse = schulconnexResponseFactory.build();
					const system: SystemEntity = systemEntityFactory.buildWithId();
					const school: SchoolEntity = schoolEntityFactory.buildWithId({
						systems: [system],
						externalId: 'externalSchoolId',
					});
					const importUser: ImportUser = createImportUser(externalUserData, school, system);

					schulconnexRestClient.getPersonenInfo.mockResolvedValueOnce([externalUserData]);

					return {
						school,
						system,
						importUser,
					};
				};

				it('should return the import users', async () => {
					const { school, system, importUser } = setup();

					const result: ImportUser[] = await service.getData(school, system);

					// TODO test this somehow
					expect(result).toEqual(importUser);
				});
			});

			describe('when the user already was migrated', () => {
				const setup = () => {
					const externalUserData: SanisResponse = schulconnexResponseFactory.build();
					const system: SystemEntity = systemEntityFactory.buildWithId();
					const school: SchoolEntity = schoolEntityFactory.buildWithId({
						systems: [system],
						externalId: 'externalSchoolId',
					});
					const importUser: ImportUser = createImportUser(externalUserData, school, system);
					const user: UserDO = userDoFactory.build({
						externalId: externalUserData.pid,
					});

					schulconnexRestClient.getPersonenInfo.mockResolvedValueOnce([externalUserData]);
					userService.findByExternalId.mockResolvedValueOnce(user);

					return {
						school,
						system,
						importUser,
					};
				};

				it('should return an empty array', async () => {
					const { school, system } = setup();

					const result: ImportUser[] = await service.getData(school, system);

					expect(result).toEqual([]);
				});
			});
		});

		describe('when the school has no external id', () => {
			const setup = () => {
				const system: SystemEntity = systemEntityFactory.buildWithId();
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [system],
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
});
