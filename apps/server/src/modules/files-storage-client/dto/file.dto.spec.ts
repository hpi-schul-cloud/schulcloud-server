import { FileRecordParamsParentTypeEnum } from '../filesStorageApi/v3';
import { FileDto } from './file.dto';

describe('FileDto', () => {
	it('Should create well formed file dto.', () => {
		const id = 'id123';
		const name = 'abc';
		const parentType: FileRecordParamsParentTypeEnum = 'users';
		const parentId = 'parent123';
		const schoolId = 'school123';

		const fileDto = new FileDto({
			id,
			name,
			parentType,
			parentId,
			schoolId,
		});

		expect(fileDto instanceof FileDto).toBe(true);
		expect(fileDto.id).toStrictEqual(id);
		expect(fileDto.name).toStrictEqual(name);
		expect(fileDto.parentType).toStrictEqual(parentType);
		expect(fileDto.parentId).toStrictEqual(parentId);
		expect(fileDto.schoolId).toStrictEqual(schoolId);
	});
});
