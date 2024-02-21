import { setupEntities } from '@shared/testing';
import { tldrawEntityFactory } from '../testing';
import { TldrawDrawing } from './tldraw-drawing.entity';

describe('tldraw entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('when creating a tldraw doc', () => {
			it('should create drawing', () => {
				const tldraw = tldrawEntityFactory.build();

				expect(tldraw).toBeInstanceOf(TldrawDrawing);
			});
		});
	});
});
