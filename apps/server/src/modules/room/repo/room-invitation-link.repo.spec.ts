import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { RoomInvitationLinkRepo } from './room-invitation-link.repo';
import { EntityManager, MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { RoomInvitationLinkEntity } from './entity/room-invitation-link.entity';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { roomInvitationLinkEntityFactory } from '../testing/room-invitation-link-entity.factory';
import { roomInvitationLinkTestFactory } from '../testing/room-invitation-link.test.factory';
import { RoomInvitationLinkDomainMapper } from './room-invitation-link-domain.mapper';
import { FlushMode } from '@mikro-orm/core';

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
		const orm = module.get(MikroORM);
		await orm.schema.ensureIndexes();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		em.setFlushMode(FlushMode.AUTO);
		em.clear();
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

	describe('findByInvitationCredential', () => {
		describe('when the invitation has a token', () => {
			const setup = async (preload = false) => {
				const token = 'A_0-'.repeat(5) + 'z';
				const link = roomInvitationLinkEntityFactory.build({ invitationToken: token });
				await em.persist(link).flush();
				em.clear();
				if (preload) {
					await repo.findById(link.id);
				}

				return { link, token };
			};

			it('should find the invitation by its invitationToken', async () => {
				const { link, token } = await setup();

				const result = await repo.findByInvitationCredential(token);

				expect(result?.id).toBe(link.id);
				expect(result?.invitationToken).toBe(token);
			});

			it('should not find the invitation by its ObjectId', async () => {
				const { link } = await setup();

				const result = await repo.findByInvitationCredential(link.id);

				expect(result).toBeNull();
			});

			it('should not find the invitation using a differently cased token', async () => {
				const { token } = await setup();

				const result = await repo.findByInvitationCredential(token.toLowerCase());

				expect(result).toBeNull();
			});

			it('should reject its ObjectId even when the invitation was already loaded', async () => {
				const { link } = await setup(true);

				const result = await repo.findByInvitationCredential(link.id);

				expect(result).toBeNull();
			});
		});

		describe('when a loaded legacy entity has been assigned a token', () => {
			const setup = async () => {
				const link = roomInvitationLinkEntityFactory.build({ invitationToken: undefined });
				await em.persist(link).flush();
				em.clear();
				const loaded = await em.findOneOrFail(RoomInvitationLinkEntity, link.id);
				loaded.invitationToken = 'A_0-'.repeat(5) + 'z';
				em.setFlushMode(FlushMode.COMMIT);

				return { link };
			};

			it('should not return the token-bearing entity by id before it is flushed', async () => {
				const { link } = await setup();

				const result = await repo.findByInvitationCredential(link.id);

				expect(result).toBeNull();
			});
		});

		describe('when the legacy invitation has no token', () => {
			const setup = async (nullToken: boolean) => {
				const link = roomInvitationLinkEntityFactory.build({ invitationToken: undefined });
				await em.persist(link).flush();
				const collection = em.getCollection(RoomInvitationLinkEntity);
				if (nullToken) {
					await em.nativeUpdate(RoomInvitationLinkEntity, link.id, { invitationToken: null });
				} else {
					await collection.updateOne({ _id: new ObjectId(link.id) }, { $unset: { invitationToken: '' } });
				}
				em.clear();

				return { link };
			};

			it('should find the invitation by its ObjectId when invitationToken is missing', async () => {
				const { link } = await setup(false);

				const result = await repo.findByInvitationCredential(link.id);

				expect(result?.id).toBe(link.id);
				expect(result?.invitationToken).toBeUndefined();
			});

			it('should find the invitation by its ObjectId when invitationToken is null', async () => {
				const { link } = await setup(true);

				const result = await repo.findByInvitationCredential(link.id);

				expect(result?.id).toBe(link.id);
				expect(result?.invitationToken).toBeUndefined();
			});
		});

		describe('when the invitation does not exist', () => {
			const setup = () => {
				const token = 'B_1-'.repeat(5) + 'z';
				const link = roomInvitationLinkEntityFactory.build({ invitationToken: token });

				return { link, token };
			};

			it('should return null for unknown tokens and ids', async () => {
				const { link, token } = setup();

				const tokenResult = await repo.findByInvitationCredential(token);
				const idResult = await repo.findByInvitationCredential(link.id);

				expect(tokenResult).toBeNull();
				expect(idResult).toBeNull();
			});
		});
	});

	describe('invitation token index', () => {
		describe('when saving invitations', () => {
			const setup = () => {
				const legacyLinks = roomInvitationLinkEntityFactory.buildList(2, { invitationToken: undefined });
				const token = 'C_2-'.repeat(5) + 'z';
				const first = roomInvitationLinkEntityFactory.build({ invitationToken: token });
				const duplicate = roomInvitationLinkEntityFactory.build({ invitationToken: token });

				return { legacyLinks, first, duplicate };
			};

			it('should allow missing tokens and enforce uniqueness of stored tokens', async () => {
				const { legacyLinks, first, duplicate } = setup();
				const collection = em.getCollection(RoomInvitationLinkEntity);

				await em.persist([...legacyLinks, first]).flush();
				await em.nativeUpdate(
					RoomInvitationLinkEntity,
					{ id: { $in: legacyLinks.map((link) => link.id) } },
					{ invitationToken: null }
				);
				const indexes = await collection.indexes();
				const saveDuplicate = em.persist(duplicate).flush();

				expect(indexes).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							name: 'roomInvitationTokenUniqueIndex',
							unique: true,
							partialFilterExpression: { invitationToken: { $type: 'string' } },
						}),
					])
				);
				await expect(saveDuplicate).rejects.toThrow();
				em.clear();
			});
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
				em.clear();
				const result = await repo.findById(roomInvitationLink.id);

				expect(result.getProps()).toEqual(roomInvitationLink.getProps());
			});
		});

		describe('when saving a room invitation link after changing its properties', () => {
			it('should persist the newest value', async () => {
				const roomInvitationLink = roomInvitationLinkTestFactory.build();

				await repo.save(roomInvitationLink);
				roomInvitationLink.title = 'new title';
				await repo.save(roomInvitationLink);
				em.clear();
				const result = await repo.findById(roomInvitationLink.id);

				expect(result.getProps()).toEqual(roomInvitationLink.getProps());
				expect(result.invitationToken).toBe(roomInvitationLink.invitationToken);
			});
		});

		describe('when updating a legacy invitation', () => {
			const setup = async () => {
				const link = roomInvitationLinkTestFactory.build({ invitationToken: undefined });
				await repo.save(link);
				em.clear();

				return { link };
			};

			it('should preserve legacy id redemption without creating a token', async () => {
				const { link } = await setup();
				link.title = 'Updated legacy invitation';

				await repo.save(link);
				em.clear();
				const result = await repo.findByInvitationCredential(link.id);

				expect(result?.title).toBe(link.title);
				expect(result?.invitationToken).toBeUndefined();
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
