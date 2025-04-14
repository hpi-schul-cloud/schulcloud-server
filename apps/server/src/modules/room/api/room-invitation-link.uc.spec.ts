import { Test, TestingModule } from '@nestjs/testing';
import { RoomInvitationLinkUc } from './room-invitation-link.uc';
import { RoomInvitationLinkRepo } from '../repo/room-invitation-link.repo';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { userFactory } from '@modules/user/testing';
import { ConfigService } from '@nestjs/config';
// import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { setupEntities } from '@testing/database';
import { User } from '@modules/user/repo';
import { AuthorizationService } from '@modules/authorization';

describe('RoomInvitationLinkUc', () => {
	let module: TestingModule;
	let uc: RoomInvitationLinkUc;
	let configService: DeepMocked<ConfigService>;
	let roomInvitationLinkRepo: DeepMocked<RoomInvitationLinkRepo>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				RoomInvitationLinkUc,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: RoomInvitationLinkRepo,
					useValue: createMock<RoomInvitationLinkRepo>(),
				},
			],
		}).compile();

		uc = module.get<RoomInvitationLinkUc>(RoomInvitationLinkUc);
		configService = module.get(ConfigService);
		roomInvitationLinkRepo = module.get(RoomInvitationLinkRepo);
		authorizationService = module.get(AuthorizationService);
		await setupEntities([User]);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('getRoomInvitationLinkById', () => {
		const setup = () => {
			const user = userFactory.build();
			configService.get.mockReturnValue(true);
			authorizationService.getUserWithPermissions.mockResolvedValue(user);
			authorizationService.checkOneOfPermissions.mockReturnValue(undefined);
			return { user };
		};

		// it('should throw FeatureDisabledLoggableException when feature is disabled', async () => {
		// 	setup();
		// 	configService.get.mockReturnValue(false);

		// 	await expect(uc.getRoomInvitationLinkById('userId', '')).rejects.toThrow(FeatureDisabledLoggableException);
		// });

		it('should call roomInvitationLinkRepo.findById with the correct id', async () => {
			const linkId = 'some-id';
			const { user } = setup();

			await uc.getRoomInvitationLinkById(user.id, linkId);

			expect(roomInvitationLinkRepo.findById).toHaveBeenCalledWith(linkId);
		});
	});
});
