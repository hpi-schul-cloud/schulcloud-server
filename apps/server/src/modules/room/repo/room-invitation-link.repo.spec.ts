import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { RoomInvitationLinkRepo } from './room-invitation-link.repo';
import { EntityManager } from '@mikro-orm/mongodb';
import { RoomInvitationLinkEntity } from './entity/room-invitation-link.entity';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { roomInvitationLinkEntityFactory } from '../testing/room-invitation-link-entity.factory';
import { roomInvitationLinkTestFactory } from '../testing/room-invitation-link.test.factory';
import { RoomInvitationLinkDomainMapper } from './room-invitation-link-domain.mapper';

describe('RoomInvitationLinkRepo', () => {
	let module: TestingModule;
	let repo: RoomInvitationLinkRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [RoomInvitationLinkEntity] })],
			providers: [RoomInvitationLinkRepo, RoomInvitationLinkDomainMapper],
		}).compile();

		repo = module.get(RoomInvitationLinkRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findById', () => {
		it('should find a room invitation link by id', async () => {
			const roomInvitationLinks = roomInvitationLinkEntityFactory.buildList(3);
			await em.persist(roomInvitationLinks).flush();
			em.clear();
			const [, second] = roomInvitationLinks;

			const result = await repo.findById(second.id);

			expect(second).toEqual(expect.objectContaining(result.getProps()));
		});
	});

	describe('findByIds', () => {
		it('should find a room invitation link by id', async () => {
			const roomInvitationLinks = roomInvitationLinkEntityFactory.buildList(3);
			await em.persist(roomInvitationLinks).flush();
			em.clear();
			const [, second, third] = roomInvitationLinks;

			const result = await repo.findByIds([second.id, third.id]);

			expect(result).toHaveLength(2);
			expect(second).toEqual(expect.objectContaining(result[0].getProps()));
			expect(third).toEqual(expect.objectContaining(result[1].getProps()));
		});
	});

	describe('findByRoomId', () => {
		describe('when roomId is not found', () => {
			it('should return an empty array', async () => {
				const roomInvitationLinks = roomInvitationLinkEntityFactory.buildList(3);
				await em.persist(roomInvitationLinks).flush();
				em.clear();

				const result = await repo.findByRoomId('non-existing-room-id');

				expect(result).toEqual([]);
			});
		});

		describe('when roomId is found', () => {
			it('should return an array of room invitation links for this room', async () => {
				const roomId = 'room-id';
				const roomInvitationLinks = roomInvitationLinkEntityFactory.buildList(2, { roomId });
				const otherInvitationLinks = roomInvitationLinkEntityFactory.buildList(2);
				await em.persist([...roomInvitationLinks, ...otherInvitationLinks]).flush();
				em.clear();

				const roomLinks = await repo.findByRoomId(roomId);

				expect(roomLinks).toHaveLength(2);
				expect(roomInvitationLinks).toEqual(
					expect.arrayContaining([
						expect.objectContaining(roomLinks[0].getProps()),
						expect.objectContaining(roomLinks[1].getProps()),
					])
				);
			});
		});
	});

	describe('save', () => {
		describe('when saving a room invitation link', () => {
			it('should find the persisted room invitation link', async () => {
				const roomInvitationLink = roomInvitationLinkTestFactory.build();

				await repo.save(roomInvitationLink);
				const result = await repo.findById(roomInvitationLink.id);

				expect(result).toEqual(roomInvitationLink);
			});
		});

		describe('when saving a room invitation link after changing its properties', () => {
			it('should persist the newest value', async () => {
				const roomInvitationLink = roomInvitationLinkTestFactory.build();

				await repo.save(roomInvitationLink);
				roomInvitationLink.title = 'new title';
				await repo.save(roomInvitationLink);
				const result = await repo.findById(roomInvitationLink.id);

				expect(result).toEqual(roomInvitationLink);
			});
		});
	});

	describe('delete', () => {
		it('should delete the room invitation link', async () => {
			const roomInvitationLink = roomInvitationLinkEntityFactory.build();
			await em.persist(roomInvitationLink).flush();
			em.clear();

			await repo.delete([roomInvitationLink.id]);

			await expect(repo.findById(roomInvitationLink.id)).rejects.toThrow();
		});
	});
});
