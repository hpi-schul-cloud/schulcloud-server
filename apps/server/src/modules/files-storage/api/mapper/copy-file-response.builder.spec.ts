import { CopyFileResponse } from '../dto';
import { CopyFileResponseBuilder } from './copy-file-response.builder';

describe('Copy File Response Builder', () => {
	describe('when build is called with a defined id', () => {
		const setup = () => {
			const id = 'id';
			const sourceId = 'sourceId';
			const name = 'name';

			return { id, sourceId, name };
		};

		it('should return copy file response', () => {
			const { id, sourceId, name } = setup();
			const expectedResponse = new CopyFileResponse({ id, sourceId, name });

			const result = CopyFileResponseBuilder.build(id, sourceId, name);

			expect(result).toEqual(expectedResponse);
		});
	});

	describe('when build is called with a undefined id', () => {
		const setup = () => {
			const id = undefined;
			const sourceId = 'sourceId';
			const name = 'name';

			return { id, sourceId, name };
		};

		it('should return copy file response', () => {
			const { id, sourceId, name } = setup();
			const expectedResponse = new CopyFileResponse({ id, sourceId, name });

			const result = CopyFileResponseBuilder.build(id, sourceId, name);

			expect(result).toEqual(expectedResponse);
		});
	});
});
