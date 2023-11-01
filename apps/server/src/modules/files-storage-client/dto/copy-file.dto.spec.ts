import { CopyFileDto } from './copy-file.dto';

describe('CopyFileDto', () => {
	it('Should create well formed copy file dto.', () => {
		const id = 'id123';
		const sourceId = 'sourceid123';
		const name = 'abc';

		const copyFileDto = new CopyFileDto({
			id,
			sourceId,
			name,
		});

		expect(copyFileDto instanceof CopyFileDto).toBe(true);
		expect(copyFileDto.id).toStrictEqual(id);
		expect(copyFileDto.sourceId).toStrictEqual(sourceId);
		expect(copyFileDto.name).toStrictEqual(name);
	});
});
