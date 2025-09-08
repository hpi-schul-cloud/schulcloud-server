import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { MediumMetadataDto } from '../dto';
import { MediumMetadataService } from '../service';
import { mediumMetadataDtoFactory } from '../testing';
import { MediumMetadataUc } from './medium-metadata.uc';
describe(MediumMetadataUc.name, () => {
	let module: TestingModule;
	let uc: MediumMetadataUc;

	let mediumMetadataService: DeepMocked<MediumMetadataService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				MediumMetadataUc,
				{
					provide: MediumMetadataService,
					useValue: createMock<MediumMetadataService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(MediumMetadataUc);
		mediumMetadataService = module.get(MediumMetadataService);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMetadata', () => {
		describe('when checking permissions', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const currentUser = currentUserFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValue(user);

				return {
					user,
					currentUser,
				};
			};
			it('should call getUserWithPermissions', async () => {
				const { currentUser } = setup();

				await uc.getMetadata(currentUser.userId, 'medium-id', 'media-source-id');

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(currentUser.userId);
			});

			it('should call checkAllPermissions', async () => {
				const { user, currentUser } = setup();

				await uc.getMetadata(currentUser.userId, 'medium-id', 'media-source-id');

				expect(authorizationService.checkAllPermissions).toHaveBeenCalledWith(user, [Permission.MEDIA_SOURCE_ADMIN]);
			});
		});

		describe('when media sources are available', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();
				const currentUser = currentUserFactory.build();
				const mockMetadata: MediumMetadataDto = mediumMetadataDtoFactory.build();

				authorizationService.getUserWithPermissions.mockResolvedValue(user);
				mediumMetadataService.getMetadataItem.mockResolvedValue(mockMetadata);

				return {
					user,
					currentUser,
					mockMetadata,
				};
			};
			it('should return a list of media sources', async () => {
				const { currentUser, mockMetadata } = setup();

				const result = await uc.getMetadata(currentUser.userId, 'medium-id', 'media-source-id');

				expect(result).toEqual(mockMetadata);
			});
		});
	});
});
