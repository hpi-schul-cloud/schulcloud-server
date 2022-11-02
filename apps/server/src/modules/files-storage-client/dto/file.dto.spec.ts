import { FileRecordParentType } from '@src/modules/files-storage/entity/filerecord.entity';
import { FileDto } from './file.dto';

describe('FileDto', () => {
	it('Should create well formed file dto.', () => {
		const id = 'id123';
		const name = 'abc';
		const parentType = FileRecordParentType.Task;
		const parentId = 'parent123';

		const fileDto = new FileDto({
			id,
			name,
			parentType,
			parentId,
		});

		expect(fileDto instanceof FileDto).toBe(true);
		expect(fileDto.id).toStrictEqual(id);
		expect(fileDto.name).toStrictEqual(name);
		expect(fileDto.parentType).toStrictEqual(parentType);
		expect(fileDto.parentId).toStrictEqual(parentId);
	});
});
