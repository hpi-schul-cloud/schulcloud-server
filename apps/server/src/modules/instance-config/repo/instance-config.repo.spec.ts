import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { InstanceConfigProps } from '../domain';
import { InstanceConfigEntity } from '../entity';
import { instanceConfigEntityFactory, instanceConfigFactory } from '../testing';
import { InstanceConfigRepo } from './instance-config.repo';

describe(InstanceConfigRepo.name, () => {
	let module: TestingModule;
	let em: EntityManager;
	let repo: InstanceConfigRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [InstanceConfigRepo],
		}).compile();

		repo = module.get(InstanceConfigRepo);
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
				const instanceConfigEntity = instanceConfigEntityFactory.buildWithId();

				await em.persistAndFlush(instanceConfigEntity);
				em.clear();

				return {
					instanceConfigEntity,
				};
			};

			it('should return the instance config', async () => {
				const { instanceConfigEntity } = await setup();

				const result = await repo.findById(instanceConfigEntity.id);

				expect(result.getProps()).toEqual<InstanceConfigProps>({
					id: instanceConfigEntity.id,
					name: instanceConfigEntity.name,
				});
			});
		});
	});

	describe('save', () => {
		describe('when creating a new entity', () => {
			const setup = () => {
				const instanceConfig = instanceConfigFactory.build();

				return {
					instanceConfig,
				};
			};

			it('should create a new entity', async () => {
				const { instanceConfig } = setup();

				await repo.save(instanceConfig);

				await expect(em.findOneOrFail(InstanceConfigEntity, instanceConfig.id)).resolves.toBeDefined();
			});

			it('should return the saved object', async () => {
				const { instanceConfig } = setup();

				const result = await repo.save(instanceConfig);

				expect(result).toEqual(instanceConfig);
			});
		});

		describe('when the entity exists', () => {
			const setup = async () => {
				const instanceConfigEntity = instanceConfigEntityFactory.buildWithId();

				await em.persistAndFlush(instanceConfigEntity);
				em.clear();

				const instanceConfig = instanceConfigFactory.build({ id: instanceConfigEntity.id, name: 'not_nbc' });

				return {
					instanceConfig,
					instanceConfigEntity,
				};
			};

			it('should update the entity', async () => {
				const { instanceConfig, instanceConfigEntity } = await setup();

				await repo.save(instanceConfig);

				await expect(em.findOneOrFail(InstanceConfigEntity, instanceConfigEntity.id)).resolves.toEqual(
					expect.objectContaining({ name: 'not_nbc' })
				);
			});

			it('should return the object', async () => {
				const { instanceConfig } = await setup();

				const result = await repo.save(instanceConfig);

				expect(result).toEqual(instanceConfig);
			});
		});
	});
});
