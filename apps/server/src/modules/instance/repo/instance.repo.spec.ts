import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { InstanceProps } from '../domain';
import { InstanceEntity } from '../entity';
import { InstanceNotIdentifiableLoggableException } from '../loggable';
import { instanceEntityFactory, instanceFactory } from '../testing';
import { InstanceRepo } from './instance.repo';

describe(InstanceRepo.name, () => {
	let module: TestingModule;
	let em: EntityManager;
	let repo: InstanceRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [InstanceRepo],
		}).compile();

		repo = module.get(InstanceRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findById', () => {
		describe('when an entity with the id exists', () => {
			const setup = async () => {
				const instanceEntity = instanceEntityFactory.buildWithId();

				await em.persistAndFlush(instanceEntity);
				em.clear();

				return {
					instanceEntity,
				};
			};

			it('should return the instance', async () => {
				const { instanceEntity } = await setup();

				const result = await repo.findById(instanceEntity.id);

				expect(result.getProps()).toEqual<InstanceProps>({
					id: instanceEntity.id,
					name: instanceEntity.name,
				});
			});
		});
	});

	describe('save', () => {
		describe('when creating a new entity', () => {
			const setup = () => {
				const instance = instanceFactory.build();

				return {
					instance,
				};
			};

			it('should create a new entity', async () => {
				const { instance } = setup();

				await repo.save(instance);

				await expect(em.findOneOrFail(InstanceEntity, instance.id)).resolves.toBeDefined();
			});

			it('should return the saved object', async () => {
				const { instance } = setup();

				const result = await repo.save(instance);

				expect(result).toEqual(instance);
			});
		});

		describe('when the entity exists', () => {
			const setup = async () => {
				const instanceEntity = instanceEntityFactory.buildWithId();

				await em.persistAndFlush(instanceEntity);
				em.clear();

				const instance = instanceFactory.build({ id: instanceEntity.id, name: 'not_nbc' });

				return {
					instance,
					instanceEntity,
				};
			};

			it('should update the entity', async () => {
				const { instance, instanceEntity } = await setup();

				await repo.save(instance);

				await expect(em.findOneOrFail(InstanceEntity, instanceEntity.id)).resolves.toEqual(
					expect.objectContaining({ name: 'not_nbc' })
				);
			});

			it('should return the object', async () => {
				const { instance } = await setup();

				const result = await repo.save(instance);

				expect(result).toEqual(instance);
			});
		});
	});

	describe('getInstance', () => {
		describe('when the instance is identifiable', () => {
			const setup = async () => {
				const instanceEntity = instanceEntityFactory.buildWithId();

				await em.getCollection(InstanceEntity.name).deleteMany({});
				await em.persistAndFlush(instanceEntity);
				em.clear();

				return {
					instanceEntity,
				};
			};

			it('should return the instance', async () => {
				const { instanceEntity } = await setup();

				const result = await repo.getInstance();

				expect(result.getProps()).toEqual<InstanceProps>({
					id: instanceEntity.id,
					name: instanceEntity.name,
				});
			});
		});

		describe('when the instance is not identifiable', () => {
			const setup = async () => {
				await em.getCollection(InstanceEntity.name).deleteMany({});
				em.clear();
			};

			it('should throw an error', async () => {
				await setup();

				await expect(repo.getInstance()).rejects.toThrowError(InstanceNotIdentifiableLoggableException);
			});
		});
	});
});
