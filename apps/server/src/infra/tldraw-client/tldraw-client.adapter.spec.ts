import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { TldrawDocumentApi } from './generated';
import { TldrawClientAdapter } from './tldraw-client.adapter';

describe('TldrawClientAdapter', () => {
	describe('deleteDrawingBinData', () => {
		let module: TestingModule;
		let service: TldrawClientAdapter;
		let tldrawDocumentApi: DeepMocked<TldrawDocumentApi>;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				providers: [
					TldrawClientAdapter,
					{
						provide: TldrawDocumentApi,
						useValue: createMock<TldrawDocumentApi>(),
					},
				],
			}).compile();

			service = module.get(TldrawClientAdapter);
			tldrawDocumentApi = module.get(TldrawDocumentApi);
		});

		afterAll(async () => {
			await module.close();
		});

		beforeEach(() => {
			jest.resetAllMocks();
		});

		describe('when deleteByDocName resolves', () => {
			it('should call deleteDrawingBinData', async () => {
				const drawingId = 'drawingId';

				await service.deleteDrawingBinData(drawingId);

				expect(tldrawDocumentApi.deleteByDocName).toHaveBeenCalledWith(drawingId);
			});
		});

		describe('when deleteByDocName rejects', () => {
			it('should throw an error', async () => {
				const drawingId = 'drawingId';
				const error = new Error('deleteByDocName error');

				tldrawDocumentApi.deleteByDocName.mockRejectedValue(error);

				await expect(service.deleteDrawingBinData(drawingId)).rejects.toThrowError(error);
			});
		});
	});
});
