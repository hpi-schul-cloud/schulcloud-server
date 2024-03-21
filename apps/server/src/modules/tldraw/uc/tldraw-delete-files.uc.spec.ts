import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { YMap } from 'yjs/dist/src/types/YMap';
import { TldrawFilesStorageAdapterService } from '../service';
import { YMongodb } from '../repo';
import { TldrawDeleteFilesUc } from './tldraw-delete-files.uc';
import { WsSharedDocDo } from '../domain';
import { TldrawAsset, TldrawShape, TldrawShapeType } from '../types';

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
			const assets: YMap<TldrawAsset> = doc.getMap('assets');
			shapes.set('shape1', { id: 'shape1', type: TldrawShapeType.Image, assetId: 'asset1' });
			shapes.set('shape2', { id: 'shape2', type: TldrawShapeType.Draw });
			assets.set('asset1', {
				id: 'asset1',
				type: TldrawShapeType.Image,
				name: 'asset1.jpg',
				src: '/filerecordid1/file1.jpg',
			});
			assets.set('asset2', {
				id: 'asset2',
				type: TldrawShapeType.Image,
				name: 'asset2.jpg',
				src: '/filerecordid2/file2.jpg',
			});

			mdb.getDocument.mockResolvedValueOnce(doc);
		};

		it('should call deleteUnusedFilesForDocument on TldrawFilesStorageAdapterService correct number of times', async () => {
			setup();

			await uc.deleteUnusedFiles(new Date());

			expect(filesStorageAdapterService.deleteUnusedFilesForDocument).toHaveBeenCalledTimes(1);
		});
	});
});
