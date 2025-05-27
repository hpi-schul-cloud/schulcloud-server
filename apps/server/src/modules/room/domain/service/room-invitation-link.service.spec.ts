import { Test, TestingModule } from '@nestjs/testing';
import { RoomInvitationLinkService } from './room-invitation-link.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RoomInvitationLinkRepo } from '../../repo';
import { roomInvitationLinkTestFactory } from '@modules/room/testing/room-invitation-link.test.factory';
import { RoomDeletedEvent } from '../events/room-deleted.event';

describe('RoomInvitationLinkService', () => {
	let module: TestingModule;
	let service: RoomInvitationLinkService;
	let repo: DeepMocked<RoomInvitationLinkRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RoomInvitationLinkService,
				{
					provide: RoomInvitationLinkRepo,
					useValue: createMock<RoomInvitationLinkRepo>(),
				},
			],
		}).compile();

		service = module.get<RoomInvitationLinkService>(RoomInvitationLinkService);
		repo = module.get(RoomInvitationLinkRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('createLink', () => {
		describe('when new link is created', () => {
			it('should call repo to save the link', async () => {
				const inOneWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

				const props = {
					title: 'Test Link',
					isOnlyForTeachers: true,
					restrictedToCreatorSchool: false,
					activeUntil: inOneWeek,
					roomId: '789',
					creatorUserId: '101112',
					creatorSchoolId: '131415',
					requiresConfirmation: true,
				};

				const result = await service.createLink(props);

				expect(result.id).toBeDefined();
				expect(repo.save).toHaveBeenCalledWith(result);
			});
		});
	});

	describe('saveLink', () => {
		it('should call repo to save the link', async () => {
			const roomInvitationLink = roomInvitationLinkTestFactory.build();

			const result = await service.saveLink(roomInvitationLink);

			expect(result).toBe(roomInvitationLink);
			expect(repo.save).toHaveBeenCalledWith(roomInvitationLink);
		});
	});

	describe('findByRoomId', () => {
		describe('when room has invitation links', () => {
			it('should return the links', async () => {
				const roomId = '123';
				const roomInvitationLinks = roomInvitationLinkTestFactory.buildList(3, { roomId });
				repo.findByRoomId.mockResolvedValue(roomInvitationLinks);

				const result = await service.findLinkByRoomId(roomId);

				expect(result).toEqual(roomInvitationLinks);
			});
		});
	});

	describe('findById', () => {
		describe('when link exists', () => {
			it('should return the links', async () => {
				const roomId = '123';
				const roomInvitationLinks = roomInvitationLinkTestFactory.buildList(3, { roomId });
				const secondLink = roomInvitationLinks[1];
				repo.findById.mockResolvedValue(secondLink);

				const result = await service.findById(secondLink.id);

				expect(result).toEqual(secondLink);
			});
		});

		describe('when link does not exists', () => {
			it('should return an empty array', async () => {
				repo.findById.mockRejectedValue(new Error('Link not found'));

				await expect(service.findById('non-existing-link-id')).rejects.toThrowError();
			});
		});
	});

	describe('findByIds', () => {
		describe('when link exists', () => {
			it('should return the links', async () => {
				const roomId = '123';
				const roomInvitationLinks = roomInvitationLinkTestFactory.buildList(3, { roomId });
				const secondLink = roomInvitationLinks[1];
				repo.findByIds.mockResolvedValue([secondLink]);

				const result = await service.findByIds([secondLink.id]);

				expect(result).toEqual([secondLink]);
			});
		});

		describe('when link does not exists', () => {
			it('should return an empty array', async () => {
				repo.findByIds.mockResolvedValue([]);

				const result = await service.findByIds(['non-existing-link-id']);

				expect(result).toEqual([]);
			});
		});
	});

	describe('findByRoomId', () => {
		describe('when room has invitation links', () => {
			it('should return the links', async () => {
				const roomId = '123';
				const roomInvitationLinks = roomInvitationLinkTestFactory.buildList(3, { roomId });
				repo.findByRoomId.mockResolvedValue(roomInvitationLinks);

				const result = await service.findLinkByRoomId(roomId);

				expect(result).toEqual(roomInvitationLinks);
			});
		});
	});

	describe('deleteLink', () => {
		it('should call repo to delete the link', async () => {
			const linkId = '123';
			await service.deleteLinks([linkId]);

			expect(repo.delete).toHaveBeenCalledWith([linkId]);
		});
	});

	describe('handle room deleted event', () => {
		it('should delete all links', async () => {
			const roomId = '456';
			const roomInvitationLinks = roomInvitationLinkTestFactory.buildList(3, { roomId });
			repo.findByRoomId.mockResolvedValue(roomInvitationLinks);
			await service.handle(new RoomDeletedEvent(roomId));

			expect(repo.delete).toHaveBeenCalledWith(roomInvitationLinks.map((link) => link.id));
		});
	});
});
