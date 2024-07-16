import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { SystemEntity } from '@modules/system/entity';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity } from '@shared/domain/entity';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import {
	schoolEntityFactory,
	schoolSystemOptionsEntityFactory,
	schoolSystemOptionsFactory,
	systemEntityFactory,
} from '@shared/testing';
import { SchoolSystemOptions, SchulConneXProvisioningOptions } from '../domain';
import { SchoolSystemOptionsEntity } from '../entity';
import { ProvisioningStrategyMissingLoggableException } from '../loggable';
import { SchoolSystemOptionsRepo } from './school-system-options.repo';

describe(SchoolSystemOptionsRepo.name, () => {
	let module: TestingModule;
	let repo: SchoolSystemOptionsRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SchoolSystemOptionsRepo],
		}).compile();

		repo = module.get(SchoolSystemOptionsRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findBySchoolIdAndSystemId', () => {
		describe('when an entity exists', () => {
			const setup = async () => {
				const schoolSystemOptionsEntity: SchoolSystemOptionsEntity = schoolSystemOptionsEntityFactory.buildWithId({
					provisioningOptions: {
						groupProvisioningOtherEnabled: true,
						groupProvisioningClassesEnabled: true,
						groupProvisioningCoursesEnabled: true,
						schoolExternalToolProvisioningEnabled: true,
					},
				});

				await em.persistAndFlush(schoolSystemOptionsEntity);
				em.clear();

				return {
					schoolSystemOptionsEntity,
				};
			};

			it('should return the options object', async () => {
				const { schoolSystemOptionsEntity } = await setup();

				const result: SchoolSystemOptions | null = await repo.findBySchoolIdAndSystemId(
					schoolSystemOptionsEntity.school.id,
					schoolSystemOptionsEntity.system.id
				);

				expect(result?.getProps()).toEqual({
					id: schoolSystemOptionsEntity.id,
					schoolId: schoolSystemOptionsEntity.school.id,
					systemId: schoolSystemOptionsEntity.system.id,
					provisioningOptions: {
						groupProvisioningOtherEnabled: true,
						groupProvisioningCoursesEnabled: true,
						groupProvisioningClassesEnabled: true,
						schoolExternalToolProvisioningEnabled: true,
					},
				});
			});
		});

		describe('when the entity does not exists', () => {
			it('should return null', async () => {
				const result: SchoolSystemOptions | null = await repo.findBySchoolIdAndSystemId(
					new ObjectId().toHexString(),
					new ObjectId().toHexString()
				);

				expect(result).toBeNull();
			});
		});

		describe('when the linked system has no provisioning strategy', () => {
			const setup = async () => {
				const schoolSystemOptionsEntity: SchoolSystemOptionsEntity = schoolSystemOptionsEntityFactory.buildWithId({
					system: systemEntityFactory.buildWithId({ provisioningStrategy: undefined }),
					provisioningOptions: {
						groupProvisioningOtherEnabled: true,
						groupProvisioningClassesEnabled: true,
						groupProvisioningCoursesEnabled: true,
					},
				});

				await em.persistAndFlush(schoolSystemOptionsEntity);
				em.clear();

				return {
					schoolSystemOptionsEntity,
				};
			};

			it('should throw an error', async () => {
				const { schoolSystemOptionsEntity } = await setup();

				await expect(
					repo.findBySchoolIdAndSystemId(schoolSystemOptionsEntity.school.id, schoolSystemOptionsEntity.system.id)
				).rejects.toThrow(ProvisioningStrategyMissingLoggableException);
			});
		});
	});

	describe('save', () => {
		describe('when a new object is provided', () => {
			const setup = async () => {
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId({
					provisioningStrategy: SystemProvisioningStrategy.SANIS,
				});
				const schoolEntity: SchoolEntity = schoolEntityFactory.buildWithId({ systems: [systemEntity] });

				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: systemEntity.id,
					schoolId: schoolEntity.id,
				});

				await em.persistAndFlush([schoolEntity]);
				em.clear();

				return {
					schoolSystemOptions,
				};
			};

			it('should create a new entity', async () => {
				const { schoolSystemOptions } = await setup();

				await repo.save(schoolSystemOptions);

				await expect(em.findOneOrFail(SchoolSystemOptionsEntity, schoolSystemOptions.id)).resolves.toBeDefined();
			});

			it('should return the object', async () => {
				const { schoolSystemOptions } = await setup();

				const result: SchoolSystemOptions | null = await repo.save(schoolSystemOptions);

				expect(result?.getProps()).toEqual({
					id: schoolSystemOptions.id,
					schoolId: schoolSystemOptions.schoolId,
					systemId: schoolSystemOptions.systemId,
					provisioningOptions: {
						groupProvisioningClassesEnabled: true,
						groupProvisioningCoursesEnabled: false,
						groupProvisioningOtherEnabled: false,
						schoolExternalToolProvisioningEnabled: false,
					},
				});
			});
		});

		describe('when an entity exists', () => {
			const setup = async () => {
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId({
					provisioningStrategy: SystemProvisioningStrategy.SANIS,
				});
				const schoolEntity: SchoolEntity = schoolEntityFactory.buildWithId({ systems: [systemEntity] });
				const schoolSystemOptionsEntity: SchoolSystemOptionsEntity = schoolSystemOptionsEntityFactory.buildWithId({
					school: schoolEntity,
					system: systemEntity,
					provisioningOptions: {
						groupProvisioningOtherEnabled: false,
						groupProvisioningCoursesEnabled: false,
						groupProvisioningClassesEnabled: false,
					},
				});

				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					id: schoolSystemOptionsEntity.id,
					systemId: systemEntity.id,
					schoolId: schoolEntity.id,
					provisioningOptions: new SchulConneXProvisioningOptions().set({
						groupProvisioningOtherEnabled: true,
						groupProvisioningCoursesEnabled: true,
						groupProvisioningClassesEnabled: true,
						schoolExternalToolProvisioningEnabled: true,
					}),
				});

				await em.persistAndFlush([schoolEntity]);
				em.clear();

				return {
					schoolSystemOptions,
				};
			};

			it('should update the entity', async () => {
				const { schoolSystemOptions } = await setup();

				await repo.save(schoolSystemOptions);

				await expect(em.findOneOrFail(SchoolSystemOptionsEntity, schoolSystemOptions.id)).resolves.toEqual(
					expect.objectContaining<Partial<SchoolSystemOptionsEntity>>({
						provisioningOptions: {
							groupProvisioningOtherEnabled: true,
							groupProvisioningClassesEnabled: true,
							groupProvisioningCoursesEnabled: true,
							schoolExternalToolProvisioningEnabled: true,
						},
					})
				);
			});

			it('should return the object', async () => {
				const { schoolSystemOptions } = await setup();

				const result: SchoolSystemOptions | null = await repo.save(schoolSystemOptions);

				expect(result?.getProps()).toEqual({
					id: schoolSystemOptions.id,
					schoolId: schoolSystemOptions.schoolId,
					systemId: schoolSystemOptions.systemId,
					provisioningOptions: {
						groupProvisioningOtherEnabled: true,
						groupProvisioningCoursesEnabled: true,
						groupProvisioningClassesEnabled: true,
						schoolExternalToolProvisioningEnabled: true,
					},
				});
			});
		});

		describe('when the provided system has no provisioning strategy', () => {
			const setup = async () => {
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId({
					provisioningStrategy: undefined,
				});
				const schoolEntity: SchoolEntity = schoolEntityFactory.buildWithId({ systems: [systemEntity] });

				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: systemEntity.id,
					schoolId: schoolEntity.id,
				});

				await em.persistAndFlush([schoolEntity]);
				em.clear();

				return {
					schoolSystemOptions,
				};
			};

			it('should not create a new entity', async () => {
				const { schoolSystemOptions } = await setup();

				await expect(repo.save(schoolSystemOptions)).rejects.toThrow();

				await expect(em.findOne(SchoolSystemOptionsEntity, schoolSystemOptions.id)).resolves.toBeNull();
			});

			it('should throw an error', async () => {
				const { schoolSystemOptions } = await setup();

				await expect(repo.save(schoolSystemOptions)).rejects.toThrow(ProvisioningStrategyMissingLoggableException);
			});
		});
	});
});
