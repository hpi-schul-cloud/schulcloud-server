import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { registrationEntityFactory, registrationFactory } from '../testing';
import { RegistrationEntity } from './entity';
import { RegistrationRepo } from './registration.repo';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomEntity } from '@modules/room';

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

	describe('findByHash', () => {
		const setup = async () => {
			const hash = 'someUniqueHashValue';
			const registrationEntity = registrationEntityFactory.buildWithId({ registrationHash: hash });
			await em.persistAndFlush(registrationEntity);
			em.clear();

			return { registrationEntity, hash };
		};

		it('should be able to find a registration by registrationHash', async () => {
			const { registrationEntity, hash } = await setup();
			const result = await repo.findByHash(hash);
			const expectedProps = {
				...registrationEntity,
				roomIds: registrationEntity.roomIds.map((id) => new ObjectId(id)),
			};

			expect(result.getProps()).toEqual(expectedProps);
			expect(result.registrationHash).toEqual(hash);
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
});
