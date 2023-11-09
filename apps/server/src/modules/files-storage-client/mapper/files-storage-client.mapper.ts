import { LessonEntity, Submission, Task } from '@shared/domain';
import { FileRecordParentType } from '@shared/infra/rabbitmq';
import { CopyFileDto, FileDto } from '../dto';
import { EntitiesWithFiles, ICopyFileDomainObjectProps, IFileDomainObjectProps } from '../interfaces';

export class FilesStorageClientMapper {
	static mapfileRecordListResponseToDomainFilesDto(fileRecordListResponse: IFileDomainObjectProps[]): FileDto[] {
		const filesDto = fileRecordListResponse.map((record: IFileDomainObjectProps) => {
			const fileDto = FilesStorageClientMapper.mapFileRecordResponseToFileDto(record);

			return fileDto;
		});

		return filesDto;
	}

	static mapCopyFileListResponseToCopyFilesDto(copyFileListResponse: ICopyFileDomainObjectProps[]): CopyFileDto[] {
		const filesDto = copyFileListResponse.map((response) => {
			const fileDto = FilesStorageClientMapper.mapCopyFileResponseToCopyFileDto(response);

			return fileDto;
		});

		return filesDto;
	}

	static mapFileRecordResponseToFileDto(fileRecordResponse: IFileDomainObjectProps) {
		const parentType = FilesStorageClientMapper.mapStringToParentType(fileRecordResponse.parentType);
		const fileDto = new FileDto({
			id: fileRecordResponse.id,
			name: fileRecordResponse.name,
			parentType,
			parentId: fileRecordResponse.parentId,
		});

		return fileDto;
	}

	static mapCopyFileResponseToCopyFileDto(response: ICopyFileDomainObjectProps) {
		const dto = new CopyFileDto({
			id: response.id,
			sourceId: response.sourceId,
			name: response.name,
		});

		return dto;
	}

	static mapStringToParentType(input: string): FileRecordParentType {
		let response: FileRecordParentType;
		const allowedStrings = Object.values(FileRecordParentType);

		if (allowedStrings.includes(input as FileRecordParentType)) {
			response = input as FileRecordParentType;
		} else {
			throw new Error(`Mapping type is not supported. ${input}`);
		}

		return response;
	}

	static mapEntityToParentType(entity: EntitiesWithFiles): FileRecordParentType {
		if (entity instanceof LessonEntity) return FileRecordParentType.Lesson;

		if (entity instanceof Task) return FileRecordParentType.Task;

		if (entity instanceof Submission) return FileRecordParentType.Submission;

		throw new Error(`Mapping type is not supported.`);
	}
}
