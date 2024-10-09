import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { ContentStorage } from '@src/modules/h5p-editor';
import { ContentMetadata } from '@src/modules/h5p-editor/entity';
import { H5pUrlHandler } from './h5p-url-handler';

describe(H5pUrlHandler.name, () => {
	let module: TestingModule;
	let contentStorage: DeepMocked<ContentStorage>;
	let h5pUrlHandler: H5pUrlHandler;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5pUrlHandler,
				{
					provide: ContentStorage,
					useValue: createMock<ContentStorage>(),
				},
			],
		}).compile();

		contentStorage = module.get(ContentStorage);
		h5pUrlHandler = module.get(H5pUrlHandler);
		await setupEntities();
	});

	describe('getMetaData', () => {
		describe('when url fits', () => {
			it('should call contentStorage with the correct id', async () => {
				const id = 'af322312feae';
				const url = `https://localhost/h5p/player/${id}`;

				await h5pUrlHandler.getMetaData(url);

				expect(contentStorage.getMetadata).toHaveBeenCalledWith(id);
			});

			it('should take the title from the contents name', async () => {
				const id = 'af322312feae';
				const url = `https://localhost/h5p/player/${id}`;
				const contentTitle = 'My Content';
				contentStorage.getMetadata.mockResolvedValue({ title: contentTitle } as ContentMetadata);

				const result = await h5pUrlHandler.getMetaData(url);

				expect(result).toEqual(expect.objectContaining({ title: contentTitle, type: 'external' }));
			});
		});

		describe('when url does not fit', () => {
			it('should return undefined', async () => {
				const url = `https://localhost/invalid/ef2345abe4e3b`;

				const result = await h5pUrlHandler.getMetaData(url);

				expect(result).toBeUndefined();
			});
		});
	});
});
