import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { YMap } from 'yjs/dist/src/types/YMap';
import { TldrawFilesStorageAdapterService } from '../service';
import { YMongodb } from '../repo';
import { TldrawDeleteFilesUc } from './tldraw-delete-files.uc';
import { WsSharedDocDo } from '../domain';
import { TldrawAsset, TldrawShape, TldrawShapeType } from '../types';
import { tldrawShapeFactory, tldrawAssetFactory } from '../testing';

describe('TldrawDeleteFilesUc', () => {
	let uc: TldrawDeleteFilesUc;
	let mdb: DeepMocked<YMongodb>;
	let filesStorageAdapterService: DeepMocked<TldrawFilesStorageAdapterService>;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TldrawDeleteFilesUc,
				{
					provide: YMongodb,
					useValue: createMock<YMongodb>(),
				},
				{
					provide: TldrawFilesStorageAdapterService,
					useValue: createMock<TldrawFilesStorageAdapterService>(),
				},
			],
		}).compile();

		uc = module.get(TldrawDeleteFilesUc);
		mdb = module.get(YMongodb);
		filesStorageAdapterService = module.get(TldrawFilesStorageAdapterService);
	});

	it('should be defined', () => {
		expect(uc).toBeDefined();
	});

	describe('deleteUnusedFiles', () => {
		const setup = () => {
			mdb.getAllDocumentNames.mockResolvedValueOnce(['doc1']);
			const doc = new WsSharedDocDo('doc1');

			const shapes: YMap<TldrawShape> = doc.getMap('shapes');
			const shape1 = tldrawShapeFactory.build();
			const shape2 = tldrawShapeFactory.build({ type: TldrawShapeType.Draw, assetId: undefined });
			shapes.set('shape1', shape1);
			shapes.set('shape2', shape2);

			const assets: YMap<TldrawAsset> = doc.getMap('assets');
			const asset1 = tldrawAssetFactory.build();
			const asset2 = tldrawAssetFactory.build();
			assets.set('asset1', asset1);
			assets.set('asset2', asset2);

			mdb.getDocument.mockResolvedValueOnce(doc);
		};

		it('should call deleteUnusedFilesForDocument on TldrawFilesStorageAdapterService correct number of times', async () => {
			setup();

			await uc.deleteUnusedFiles(new Date());

			expect(filesStorageAdapterService.deleteUnusedFilesForDocument).toHaveBeenCalledTimes(1);
		});
	});
});
