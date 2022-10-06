import { FileRecordParentType } from '@shared/domain';
import { ICopyFileDomainObjectProps, IFileDomainObjectProps } from '../interfaces';
import { FilesStorageClientMapper } from './files-storage-client.mapper';

describe('FilesStorageClientMapper', () => {
	describe('fileDto mapper', () => {
		const record = {
			id: 'id123',
			name: 'name',
			parentId: 'parent123',
			creatorId: 'creator123',
			size: 123,
			type: 'png',
			securityCheckStatus: 'pending',
			parentType: FileRecordParentType.Task,
		};

		const response: IFileDomainObjectProps[] = [record];

		describe('mapAxiosToFilesDto', () => {
			it('Should map to valid file Dtos.', () => {
				const result = FilesStorageClientMapper.mapAxiosToFilesDto(response);

				expect(result).toEqual(
					expect.objectContaining([
						{
							id: record.id,
							name: record.name,
							parentId: record.parentId,
							parentType: record.parentType,
						},
					])
				);
			});
		});

		describe('mapfileRecordListResponseToDomainFilesDto', () => {
			it('Should map to valid file Dtos.', () => {
				const result = FilesStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(response);

				expect(result).toEqual(
					expect.objectContaining([
						{
							id: record.id,
							name: record.name,
							parentId: record.parentId,
							parentType: record.parentType,
						},
					])
				);
			});
		});

		describe('mapFileRecordResponseToFileDto', () => {
			it('Should map to valid file Dto.', () => {
				const result = FilesStorageClientMapper.mapFileRecordResponseToFileDto(record);

				expect(result).toEqual(
					expect.objectContaining({
						id: record.id,
						name: record.name,
						parentId: record.parentId,
						parentType: record.parentType,
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
		const copyFileResponse: ICopyFileDomainObjectProps = {
			id: 'id123',
			sourceId: 'sourceId123',
			name: 'name',
		};

		const list: ICopyFileDomainObjectProps[] = [copyFileResponse];

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
