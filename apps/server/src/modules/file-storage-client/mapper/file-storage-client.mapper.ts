import { EntityId, FileRecordParentType } from '@shared/domain';
import { AxiosResponse } from 'axios';
import { FileRecordListResponse, FileRecordParamsParentTypeEnum, FileRecordResponse } from '../fileStorageApi/v3';
import { FileDto } from '../dto';

export class FileStorageClientMapper {
	static mapAxiosToFilesDto(response: AxiosResponse<FileRecordListResponse>, schoolId: EntityId): FileDto[] {
		const filesDto = FileStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(response.data, schoolId);

		return filesDto;
	}

	static mapfileRecordListResponseToDomainFilesDto(
		fileRecordListResponse: FileRecordListResponse,
		schoolId: EntityId
	): FileDto[] {
		const filesDto = fileRecordListResponse.data.map((record) => {
			const fileDto = FileStorageClientMapper.mapFileRecordResponseToFileDto(record, schoolId);

			return fileDto;
		});

		return filesDto;
	}

	static mapFileRecordResponseToFileDto(fileRecordResponse: FileRecordResponse, schoolId: EntityId) {
		const parentType = FileStorageClientMapper.mapStringToPartenType(fileRecordResponse.parentType);
		const fileDto = new FileDto({
			id: fileRecordResponse.id,
			name: fileRecordResponse.name,
			parentType,
			parentId: fileRecordResponse.parentId,
			schoolId,
		});

		return fileDto;
	}

	static mapStringToPartenType(input: string): FileRecordParamsParentTypeEnum {
		let response: FileRecordParamsParentTypeEnum;
		const allowedStrings = ['users', 'courses', 'tasks', 'schools'];

		if (allowedStrings.includes(input)) {
			response = input as FileRecordParamsParentTypeEnum;
		} else {
			throw new Error(`Mapping type is not supported. ${input}`);
		}

		return response;
	}
}
