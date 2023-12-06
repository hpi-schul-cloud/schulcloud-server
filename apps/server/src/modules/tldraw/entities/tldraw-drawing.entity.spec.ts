import { setupEntities } from '@shared/testing';
import { TldrawDrawing } from './tldraw-drawing.entity';

describe('tldraw entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('when creating a tldraw doc', () => {
			it('should create drawing', () => {
				const tldraw = new TldrawDrawing({
					docName: 'test',
					version: 'v1_tst',
					value: 'bindatamock',
					_id: 'test-id',
					clock: 0,
					action: 'update',
				});
				expect(tldraw).toBeInstanceOf(TldrawDrawing);
			});

			it('should throw with empty docName', () => {
				const call = () => new TldrawDrawing({ docName: '', version: 'v1_tst', value: 'bindatamock', _id: 'test-id' });
				expect(call).toThrow();
			});
		});
	});
});
