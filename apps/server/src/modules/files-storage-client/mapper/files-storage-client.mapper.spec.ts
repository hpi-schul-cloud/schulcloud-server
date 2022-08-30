import { AxiosResponse } from 'axios';
import {
	CopyFileListResponse,
	CopyFileResponse,
	FileRecordListResponse,
	FileRecordResponse,
} from '../filesStorageApi/v3';
import { FilesStorageClientMapper } from './files-storage-client.mapper';

describe('FilesStorageClientMapper', () => {
	describe('fileDto mapper', () => {
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
				const result = FilesStorageClientMapper.mapAxiosToFilesDto(response, schoolId);

				expect(result).toEqual(
					expect.objectContaining([
						{
							id: record.id,
							name: record.name,
							parentId: record.parentId,
							parentType: record.parentType,
							schoolId,
						},
					])
				);
			});
		});

		describe('mapfileRecordListResponseToDomainFilesDto', () => {
			it('Should map to valid file Dtos.', () => {
				const result = FilesStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(list, schoolId);

				expect(result).toEqual(
					expect.objectContaining([
						{
							id: record.id,
							name: record.name,
							parentId: record.parentId,
							parentType: record.parentType,
							schoolId,
						},
					])
				);
			});
		});

		describe('mapFileRecordResponseToFileDto', () => {
			it('Should map to valid file Dto.', () => {
				const result = FilesStorageClientMapper.mapFileRecordResponseToFileDto(record, schoolId);

				expect(result).toEqual(
					expect.objectContaining({
						id: record.id,
						name: record.name,
						parentId: record.parentId,
						parentType: record.parentType,
						schoolId,
					})
				);
			});

			it.todo('Should use FileStorageClientMapper.mapStringToPartenType for map parentTypes');
		});

		describe('mapStringToPartenType', () => {
			it('Should map "users".', () => {
				const result = FilesStorageClientMapper.mapStringToParentType('users');

				expect(result).toStrictEqual('users');
			});

			it('Should map "courses".', () => {
				const result = FilesStorageClientMapper.mapStringToParentType('courses');

				expect(result).toStrictEqual('courses');
			});

			it('Should map "schools".', () => {
				const result = FilesStorageClientMapper.mapStringToParentType('schools');

				expect(result).toStrictEqual('schools');
			});

			it('Should map "tasks".', () => {
				const result = FilesStorageClientMapper.mapStringToParentType('tasks');

				expect(result).toStrictEqual('tasks');
			});

			it('Should throw for not supported mappings', () => {
				expect(() => FilesStorageClientMapper.mapStringToParentType('abc')).toThrowError();
			});
		});
	});

	describe('copyFileDto mapper', () => {
		const copyFileResponse: CopyFileResponse = {
			id: 'id123',
			sourceId: 'sourceId123',
			name: 'name',
		};

		const list: CopyFileListResponse = { data: [copyFileResponse], total: 1, skip: 0, limit: 100 };

		const response: AxiosResponse<CopyFileListResponse> = {
			data: list,
			status: 200,
			statusText: 'bla',
			config: {},
			headers: {},
		};

		describe('mapAxiosToCopyFilesDto', () => {
			it('Should map to valid copy file Dtos.', () => {
				const result = FilesStorageClientMapper.mapAxiosToCopyFilesDto(response);

				expect(result).toEqual(
					expect.objectContaining([
						{
							...copyFileResponse,
						},
					])
				);
			});
		});

		describe('mapCopyFileListResponseToCopyFilesDto', () => {
			it('Should map to valid file Dtos.', () => {
				const result = FilesStorageClientMapper.mapCopyFileListResponseToCopyFilesDto(list);

				expect(result).toEqual(
					expect.objectContaining([
						{
							...copyFileResponse,
						},
					])
				);
			});
		});

		describe('mapCopyFileResponseToCopyFileDto', () => {
			it('Should map to valid file Dto.', () => {
				const result = FilesStorageClientMapper.mapCopyFileResponseToCopyFileDto(copyFileResponse);

				expect(result).toEqual(
					expect.objectContaining({
						...copyFileResponse,
					})
				);
			});

			it.todo('Should use FileStorageClientMapper.mapStringToPartenType for map parentTypes');
		});
	});
});
