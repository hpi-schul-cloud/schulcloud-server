import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { RoomEntity } from '@modules/room';
import { roomEntityFactory } from '@modules/room/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { registrationEntityFactory, registrationFactory } from '../testing';
import { RegistrationEntity } from './entity';
import { RegistrationRepo } from './registration.repo';

describe('RegistrationRepo', () => {
	let module: TestingModule;
	let repo: RegistrationRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [RegistrationEntity, RoomEntity] })],
			providers: [RegistrationRepo],
		}).compile();

		repo = module.get(RegistrationRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('save', () => {
		const setup = () => {
			const registrations = registrationFactory.buildList(3);
			return { registrations };
		};

		it('should be able to persist a single registration', async () => {
			const { registrations } = setup();

			await repo.save(registrations[0]);
			const result = await em.findOneOrFail(RegistrationEntity, registrations[0].id);

			expect(registrations[0].getProps()).toMatchObject(result);
		});

		it('should be able to persist many registrations', async () => {
			const { registrations } = setup();

			await repo.save(registrations);
			const result = await em.find(RegistrationEntity, { id: { $in: registrations.map((r) => r.id) } });

			expect(result.length).toBe(registrations.length);
		});
	});

	describe('findById', () => {
		const setup = async () => {
			const registrationEntity = registrationEntityFactory.buildWithId();
			await em.persistAndFlush(registrationEntity);
			em.clear();

			return { registrationEntity };
		};

		it('should be able to find a registration by its ID', async () => {
			const { registrationEntity } = await setup();

			const result = await repo.findById(registrationEntity.id);
			const expectedProps = {
				...registrationEntity,
				roomIds: registrationEntity.roomIds.map((id) => new ObjectId(id)),
			};

			expect(result.getProps()).toEqual(expectedProps);
		});
	});

	describe('findByEmail', () => {
		const setup = async () => {
			const mockedEmail = 'test@example.com';
			const registrationEntity = registrationEntityFactory.buildWithId({ email: mockedEmail });
			await em.persistAndFlush(registrationEntity);
			em.clear();

			return { registrationEntity, mockedEmail };
		};

		it('should be able to find an existing registration by its email', async () => {
			const { registrationEntity, mockedEmail } = await setup();
			const result = await repo.findByEmail(mockedEmail);
			const expectedProps = {
				...registrationEntity,
				roomIds: registrationEntity.roomIds.map((id) => new ObjectId(id)),
			};

			expect(result?.getProps()).toEqual(expectedProps);
		});

		it('should return null when trying to find a non-existing registration', async () => {
			const result = await repo.findByEmail('nonexistent@example.com');
			expect(result).toBeNull();
		});
	});

	describe('findByHash', () => {
		const setup = async () => {
			const registrationEntity = registrationEntityFactory.buildWithId();
			await em.persistAndFlush(registrationEntity);
			em.clear();

			return { registrationEntity };
		};

		it('should be able to find a registration by registrationSecret', async () => {
			const { registrationEntity } = await setup();

			const result = await repo.findBySecret(registrationEntity.registrationSecret);
			const expectedProps = {
				...registrationEntity,
				roomIds: registrationEntity.roomIds.map((id) => new ObjectId(id)),
			};

			expect(result.getProps()).toEqual(expectedProps);
		});
	});

	describe('findByRoomId', () => {
		const setup = async () => {
			const roomOne = roomEntityFactory.buildWithId();
			const roomTwo = roomEntityFactory.buildWithId();
			const registrationEntityOne = registrationEntityFactory.buildWithId({ roomIds: [roomOne.id] });
			const registrationEntityTwo = registrationEntityFactory.buildWithId({ roomIds: [roomOne.id, roomTwo.id] });
			const registrationEntityThree = registrationEntityFactory.buildWithId({ roomIds: [roomTwo.id] });
			await em.persistAndFlush([
				roomOne,
				roomTwo,
				registrationEntityOne,
				registrationEntityTwo,
				registrationEntityThree,
			]);
			em.clear();

			return { roomOne, roomTwo, registrationEntityOne, registrationEntityTwo, registrationEntityThree };
		};

		it('should be able to find correct registrations by roomId', async () => {
			const { registrationEntityOne, registrationEntityTwo, registrationEntityThree, roomOne } = await setup();

			const result = await repo.findByRoomId(roomOne.id);
			expect(result.length).toBe(2);
			expect(result.map((r) => r.id)).toEqual(
				expect.arrayContaining([registrationEntityOne.id, registrationEntityTwo.id])
			);
			expect(result.map((r) => r.id)).not.toContain(registrationEntityThree.id);
		});
	});

	describe('deleteByIds', () => {
		const setup = async () => {
			const registrationEntities = registrationEntityFactory.buildList(3);
			await em.persistAndFlush(registrationEntities);
			em.clear();

			const registrationIds = registrationEntities.map((r) => r.id.toString());

			return { registrationEntities, registrationIds };
		};

		it('should be able to delete a single registration by its ID', async () => {
			const { registrationIds } = await setup();
			const idToDelete = registrationIds[0];
			await repo.deleteByIds([idToDelete]);

			const deletedEntity = await em.findOne(RegistrationEntity, { id: idToDelete });
			expect(deletedEntity).toBeNull();

			const remainingEntities = await em.find(RegistrationEntity, {});
			expect(remainingEntities.length).toBe(2);
		});

		it('should be able to delete multiple registrations by their IDs', async () => {
			const { registrationIds } = await setup();
			const idsToDelete = registrationIds.slice(0, 2);
			await repo.deleteByIds(idsToDelete);

			const deletedEntities = await em.find(RegistrationEntity, { id: { $in: idsToDelete } });
			expect(deletedEntities.length).toBe(0);

			const remainingEntities = await em.find(RegistrationEntity, {});
			expect(remainingEntities.length).toBe(1);
		});

		it('should ignore non-existing IDs when deleting', async () => {
			const { registrationIds } = await setup();
			const [firstId, secondId, thirdId] = registrationIds;
			const nonExistingId = 'nonexistent-id';
			await repo.deleteByIds([firstId, nonExistingId]);

			const deletedEntity = await em.findOne(RegistrationEntity, { id: firstId });
			expect(deletedEntity).toBeNull();

			const remainingEntities = await em.find(RegistrationEntity, {});
			const remainingIds = remainingEntities.map((r) => r.id);
			expect(remainingIds).toEqual([secondId, thirdId]);
			expect(remainingEntities.length).toBe(2);
		});
	});
});
