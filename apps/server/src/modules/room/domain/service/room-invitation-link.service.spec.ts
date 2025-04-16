import { Test, TestingModule } from '@nestjs/testing';
import { RoomInvitationLinkService } from './room-invitation-link.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RoomInvitationLinkRepo } from '../../repo';
import { roomInvitationLinkTestFactory } from '@modules/room/testing/room-invitation-link.test.factory';
import { RoomInvitationLinkProps } from '../do/room-invitation-link.do';

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
				const props = {
					title: 'Test Link',
					isOnlyForTeachers: true,
					restrictedToCreatorSchool: false,
					activeUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
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

	describe('updateLink', () => {
		describe('when link exists and is updated', () => {
			it('should call repo to update the link', async () => {
				const roomInvitationLink = roomInvitationLinkTestFactory.build();
				repo.findById.mockResolvedValue(roomInvitationLink);

				const activeUnitil = new Date(Date.now() + 2000 * 60 * 60 * 24 * 14);

				roomInvitationLink.title = 'Updated Link';
				roomInvitationLink.restrictedToCreatorSchool = true;
				roomInvitationLink.isOnlyForTeachers = false;
				roomInvitationLink.activeUntil = activeUnitil;
				roomInvitationLink.requiresConfirmation = false;

				const result = await service.updateLink(roomInvitationLink);

				expect(result.id).toBe(roomInvitationLink.id);
				expect(repo.save).toHaveBeenCalledWith(roomInvitationLink);

				expect(result.title).toBe('Updated Link');
				expect(result.restrictedToCreatorSchool).toBe(true);
				expect(result.isOnlyForTeachers).toBe(false);
				expect(result.activeUntil).toEqual(activeUnitil);
				expect(result.requiresConfirmation).toBe(false);
			});
		});

		describe('when link does not exist', () => {
			it('should fail', async () => {
				repo.findById.mockRejectedValue(new Error('Link not found'));

				await expect(service.updateLink({ id: 'non-existing-id' } as RoomInvitationLinkProps)).rejects.toThrowError();
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
			await service.deleteLink(linkId);

			expect(repo.delete).toHaveBeenCalledWith(linkId);
		});
	});
});
