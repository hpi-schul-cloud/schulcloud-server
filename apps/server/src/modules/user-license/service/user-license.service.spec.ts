import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaUserLicense } from '../domain';
import { UserLicenseType } from '../entity';
import { UserLicenseRepo } from '../repo';
import { mediaUserLicenseFactory } from '../testing';
import { UserLicenseService } from './user-license.service';

describe(UserLicenseService.name, () => {
	let module: TestingModule;
	let service: UserLicenseService;

	let userLicenseRepo: DeepMocked<UserLicenseRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserLicenseService,
				{
					provide: UserLicenseRepo,
					useValue: createMock<UserLicenseRepo>(),
				},
			],
		}).compile();

		service = module.get(UserLicenseService);
		userLicenseRepo = module.get(UserLicenseRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMediaUserLicensesForUser', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const mediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build();

			userLicenseRepo.findMediaUserLicenses.mockResolvedValue([mediaUserLicense]);

			return { userId, mediaUserLicense };
		};

		it('should call user license repo with correct arguments', async () => {
			const { userId } = setup();

			await service.getMediaUserLicensesForUser(userId);

			expect(userLicenseRepo.findMediaUserLicenses).toHaveBeenCalledWith({
				userId,
				type: UserLicenseType.MEDIA_LICENSE,
			});
		});

		it('should return media user licenses for user', async () => {
			const { userId, mediaUserLicense } = setup();

			const result: MediaUserLicense[] = await service.getMediaUserLicensesForUser(userId);

			expect(result).toEqual([mediaUserLicense]);
		});
	});

	describe('saveUserLicense', () => {
		it('should call user license repo with correct arguments', async () => {
			const mediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build();

			await service.saveUserLicense(mediaUserLicense);

			expect(userLicenseRepo.saveUserLicense).toHaveBeenCalledWith(mediaUserLicense);
		});
	});

	describe('deleteUserLicense', () => {
		it('should call user license repo with correct arguments', async () => {
			const mediaUserLicense: MediaUserLicense = mediaUserLicenseFactory.build();

			await service.deleteUserLicense(mediaUserLicense);

			expect(userLicenseRepo.deleteUserLicense).toHaveBeenCalledWith(mediaUserLicense);
		});
	});
});
