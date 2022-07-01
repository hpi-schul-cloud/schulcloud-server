import { FileRecordParamsParentTypeEnum } from '../filesStorageApi/v3';
import { FileParamBuilder } from './files-storage-param.builder';

describe('FileParamBuilder', () => {
	it('should build generic valid file request infos', () => {
		const jwt = 'jwt';
		const schoolId = '123';
		const parentType: FileRecordParamsParentTypeEnum = 'tasks';
		const parentId = '123';

		const result = FileParamBuilder.build(jwt, schoolId, parentType, parentId);

		const expectedResult = {
			jwt,
			schoolId,
			parentType,
			parentId,
		};

		expect(result).toStrictEqual(expectedResult);
	});

	it('Should throw for not supported parent type', () => {
		const jwt = 'jwt';
		const schoolId = '123';
		const parentType = 'abc';
		const parentId = '123';

		// @ts-expect-error: Test case
		expect(() => FileParamBuilder.build(jwt, schoolId, parentType, parentId)).toThrowError();
	});

	it('should build valid file request infos for task over shorthand task', () => {
		const jwt = 'jwt';
		const schoolId = '123';
		const parentType: FileRecordParamsParentTypeEnum = 'tasks';
		const parentId = '123';

		const result = FileParamBuilder.buildForTask(jwt, schoolId, parentId);

		const expectedResult = {
			jwt,
			schoolId,
			parentType,
			parentId,
		};

		expect(result).toStrictEqual(expectedResult);
	});
});
