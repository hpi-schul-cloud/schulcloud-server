import { FileRecordParamsParentTypeEnum } from '../filesStorageApi/v3';
import { FileRequestInfoBuilder } from './file-request-info.builder';

describe('FileRequestInfoBuilder', () => {
	it('should build generic valid file request infos', () => {
		const jwt = 'jwt';
		const schoolId = '123';
		const parentType: FileRecordParamsParentTypeEnum = 'tasks';
		const parentId = '123';

		const result = FileRequestInfoBuilder.build(jwt, schoolId, parentType, parentId);

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
		expect(() => FileRequestInfoBuilder.build(jwt, schoolId, parentType, parentId)).toThrowError();
	});

	it('should build valid file request infos for task over shorthand task', () => {
		const jwt = 'jwt';
		const schoolId = '123';
		const parentType: FileRecordParamsParentTypeEnum = 'tasks';
		const parentId = '123';

		const result = FileRequestInfoBuilder.task(jwt, schoolId, parentId);

		const expectedResult = {
			jwt,
			schoolId,
			parentType,
			parentId,
		};

		expect(result).toStrictEqual(expectedResult);
	});
});
