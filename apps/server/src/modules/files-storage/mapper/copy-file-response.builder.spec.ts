import { CopyFileResponse } from '../controller/dto';
import { CopyFileResponseBuilder } from './copy-file-response.builder';

describe('Copy File Response Builder', () => {
	describe('build is called', () => {
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
});
