import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing/factory';
import { MetaTagExtractorService } from '../service';
import { MetaTagExtractorUc } from './meta-tag-extractor.uc';

describe(MetaTagExtractorUc.name, () => {
	let module: TestingModule;
	let uc: MetaTagExtractorUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let metaTagExtractorService: DeepMocked<MetaTagExtractorService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MetaTagExtractorUc,
				{
					provide: MetaTagExtractorService,
					useValue: createMock<MetaTagExtractorService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		uc = module.get(MetaTagExtractorUc);
		authorizationService = module.get(AuthorizationService);
		metaTagExtractorService = module.get(MetaTagExtractorService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMetaData', () => {
		describe('when user exists', () => {
			const setup = () => {
				const user = userFactory.build();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return { user };
			};

			it('should check if the user is a valid user', async () => {
				const { user } = setup();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const url = 'https://www.example.com/great-example';
				await uc.getMetaData(user.id, url);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});

			it('should call meta tag extractor service', async () => {
				const { user } = setup();

				const url = 'https://www.example.com/great-example';
				await uc.getMetaData(user.id, url);

				expect(metaTagExtractorService.getMetaData).toHaveBeenCalledWith(url);
			});
		});

		describe('when user does not exist', () => {
			const setup = () => {
				const user = userFactory.build();
				authorizationService.getUserWithPermissions.mockRejectedValue(false);

				return { user };
			};

			it('should throw an UnauthorizedException', async () => {
				const { user } = setup();

				const url = 'https://www.example.com/great-example';
				await expect(uc.getMetaData(user.id, url)).rejects.toThrow(UnauthorizedException);
			});
		});
	});
});
