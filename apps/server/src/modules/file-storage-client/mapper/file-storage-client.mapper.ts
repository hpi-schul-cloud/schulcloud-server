import { EntityId, FileRecordParentType } from '@shared/domain';
import { AxiosResponse } from 'axios';
import { FileRecordListResponse, FileRecordResponse } from '../fileStorageApi/v3';
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

	static mapParentTypeToString(input: FileRecordParentType): string {
		let response: string;

		if (input === FileRecordParentType.School) {
			response = 'schools';
		} else if (input === FileRecordParentType.Course) {
			response = 'courses';
		} else if (input === FileRecordParentType.Task) {
			response = 'courses';
		} else {
			response = 'users';
		}

		return response;
	}

	static mapStringToPartenType(input: string): FileRecordParentType {
		let response: FileRecordParentType;

		if (input === 'users') {
			response = FileRecordParentType.User;
		} else if (input === 'courses') {
			response = FileRecordParentType.Course;
		} else if (input === 'schools') {
			response = FileRecordParentType.School;
		} else if (input === 'tasks') {
			response = FileRecordParentType.Task;
		} else {
			throw new Error(`Mapping type is not supported. ${input}`);
		}

		return response;
	}
}
