import { EntityId, Lesson, Task } from '@shared/domain';
import { AxiosResponse } from 'axios';
import {
	CopyFileListResponse,
	CopyFileResponse,
	FileRecordListResponse,
	FileRecordParamsParentTypeEnum,
	FileRecordResponse,
} from '../filesStorageApi/v3';
import { CopyFileDto, FileDto } from '../dto';

export class FilesStorageClientMapper {
	static mapAxiosToFilesDto(response: AxiosResponse<FileRecordListResponse>, schoolId: EntityId): FileDto[] {
		const filesDto = FilesStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(response.data, schoolId);

		return filesDto;
	}

	static mapAxiosToCopyFilesDto(response: AxiosResponse<CopyFileListResponse>): CopyFileDto[] {
		const copyFilesDto = FilesStorageClientMapper.mapCopyFileListResponseToCopyFilesDto(response.data);

		return copyFilesDto;
	}

	static mapfileRecordListResponseToDomainFilesDto(
		fileRecordListResponse: FileRecordListResponse,
		schoolId: EntityId
	): FileDto[] {
		const filesDto = fileRecordListResponse.data.map((record) => {
			const fileDto = FilesStorageClientMapper.mapFileRecordResponseToFileDto(record, schoolId);

			return fileDto;
		});

		return filesDto;
	}

	static mapCopyFileListResponseToCopyFilesDto(copyFileListResponse: CopyFileListResponse): CopyFileDto[] {
		const filesDto = copyFileListResponse.data.map((response) => {
			const fileDto = FilesStorageClientMapper.mapCopyFileResponseToCopyFileDto(response);

			return fileDto;
		});

		return filesDto;
	}

	static mapFileRecordResponseToFileDto(fileRecordResponse: FileRecordResponse, schoolId: EntityId) {
		const parentType = FilesStorageClientMapper.mapStringToParentType(fileRecordResponse.parentType);
		const fileDto = new FileDto({
			id: fileRecordResponse.id,
			name: fileRecordResponse.name,
			parentType,
			parentId: fileRecordResponse.parentId,
			schoolId,
		});

		return fileDto;
	}

	static mapCopyFileResponseToCopyFileDto(response: CopyFileResponse) {
		const dto = new CopyFileDto({
			id: response.id,
			sourceId: response.sourceId,
			name: response.name,
		});

		return dto;
	}

	static mapStringToParentType(input: string): FileRecordParamsParentTypeEnum {
		let response: FileRecordParamsParentTypeEnum;
		const allowedStrings = ['users', 'courses', 'tasks', 'schools', 'lessons'];

		if (allowedStrings.includes(input)) {
			response = input as FileRecordParamsParentTypeEnum;
		} else {
			throw new Error(`Mapping type is not supported. ${input}`);
		}

		return response;
	}

	static mapEntityToParentType(entity: Task | Lesson): FileRecordParamsParentTypeEnum {
		if (entity instanceof Lesson) return FileRecordParamsParentTypeEnum.Lessons;

		if (entity instanceof Task) return FileRecordParamsParentTypeEnum.Tasks;

		throw new Error(`Mapping type is not supported.`);
	}
}
