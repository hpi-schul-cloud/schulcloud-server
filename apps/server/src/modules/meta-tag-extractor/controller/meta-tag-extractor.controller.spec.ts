import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@modules/authentication';
import { Test, TestingModule } from '@nestjs/testing';
import { MetaData } from '../service';
import { MetaTagExtractorUc } from '../uc';
import { MetaTagExtractorController } from './meta-tag-extractor.controller';

describe('TaskController', () => {
	let module: TestingModule;
	let controller: MetaTagExtractorController;
	let uc: DeepMocked<MetaTagExtractorUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: MetaTagExtractorUc,
					useValue: createMock<MetaTagExtractorUc>(),
				},
			],
			controllers: [MetaTagExtractorController],
		}).compile();

		controller = module.get(MetaTagExtractorController);
		uc = module.get(MetaTagExtractorUc);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('getData', () => {
		describe('when image url is provided', () => {
			const setup = () => {
				const currentUser = { userId: 'fakeUserId' } as ICurrentUser;
				const ucResult = {
					url: '',
					title: 'example title',
				} as MetaData;
				uc.fetchMetaData.mockResolvedValue(ucResult);
				return { currentUser };
			};

			it('should call uc with two parentIds', async () => {
				const { currentUser } = setup();

				const url = 'https://super-duper-url.com';
				await controller.getData(currentUser, { url });

				expect(uc.fetchMetaData).toHaveBeenCalledWith(currentUser.userId, url);
			});
		});
	});
});
