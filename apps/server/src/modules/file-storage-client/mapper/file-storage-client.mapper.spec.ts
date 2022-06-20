import { AxiosResponse } from 'axios';
import { FileDto } from '../dto';
import { FileRecordListResponse, FileRecordParamsParentTypeEnum, FileRecordResponse } from '../fileStorageApi/v3';
import { FileStorageClientMapper } from './file-storage-client.mapper';

describe('FileStorageClientMapper', () => {
	const schoolId = 'school123';
	const record: FileRecordResponse = {
		id: 'id123',
		name: 'name',
		parentId: 'parent123',
		creatorId: 'creator123',
		size: 123,
		type: 'png',
		securityCheckStatus: 'pending',
		parentType: 'tasks',
	};
	const list: FileRecordListResponse = { data: [record], total: 1, skip: 0, limit: 100 };
	const response: AxiosResponse<FileRecordListResponse> = {
		data: list,
		status: 200,
		statusText: 'bla',
		config: {},
		headers: {},
	};

	describe('mapAxiosToFilesDto', () => {
		it('Should map to valid file Dtos.', () => {
			const result = FileStorageClientMapper.mapAxiosToFilesDto(response, schoolId);

			expect(Array.isArray(result)).toBe(true);
			expect(result[0].id).toStrictEqual(record.id);
			expect(result[0].name).toStrictEqual(record.name);
			expect(result[0].parentId).toStrictEqual(record.parentId);
			expect(result[0].parentType).toStrictEqual(record.parentType);
			expect(result[0].schoolId).toStrictEqual(schoolId);
		});
	});

	describe('mapfileRecordListResponseToDomainFilesDto', () => {
		it('Should map to valid file Dtos.', () => {
			const result = FileStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(list, schoolId);

			expect(Array.isArray(result)).toBe(true);
			expect(result[0].id).toStrictEqual(record.id);
			expect(result[0].name).toStrictEqual(record.name);
			expect(result[0].parentId).toStrictEqual(record.parentId);
			expect(result[0].parentType).toStrictEqual(record.parentType);
			expect(result[0].schoolId).toStrictEqual(schoolId);
		});
	});

	describe('mapFileRecordResponseToFileDto', () => {
		it('Should map to valid file Dto.', () => {
			const result = FileStorageClientMapper.mapFileRecordResponseToFileDto(record, schoolId);

			expect(result).toBeDefined();
			expect(result.id).toStrictEqual(record.id);
			expect(result.name).toStrictEqual(record.name);
			expect(result.parentId).toStrictEqual(record.parentId);
			expect(result.parentType).toStrictEqual(record.parentType);
			expect(result.schoolId).toStrictEqual(schoolId);
		});

		it.todo('Should use FileStorageClientMapper.mapStringToPartenType for map parentTypes');
	});

	describe('mapStringToPartenType', () => {
		it('Should map "users".', () => {
			const result = FileStorageClientMapper.mapStringToPartenType('users');

			expect(result).toStrictEqual('users');
		});

		it('Should map "courses".', () => {
			const result = FileStorageClientMapper.mapStringToPartenType('courses');

			expect(result).toStrictEqual('courses');
		});

		it('Should map "schools".', () => {
			const result = FileStorageClientMapper.mapStringToPartenType('schools');

			expect(result).toStrictEqual('schools');
		});

		it('Should map "tasks".', () => {
			const result = FileStorageClientMapper.mapStringToPartenType('tasks');

			expect(result).toStrictEqual('tasks');
		});

		it('Should throw for not supported mappings', () => {
			expect(() => FileStorageClientMapper.mapStringToPartenType('abc')).toThrowError();
		});
	});
});
