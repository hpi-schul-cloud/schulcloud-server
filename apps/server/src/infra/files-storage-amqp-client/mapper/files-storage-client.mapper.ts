import { CopyFileDto, FileDto } from '../dto';
import { type CopyFileDomainObjectProps, type FileDomainObjectProps, FileRecordParentType } from '../interfaces';

export class FilesStorageClientMapper {
	public static mapfileRecordListResponseToDomainFilesDto(fileRecordListResponse: FileDomainObjectProps[]): FileDto[] {
		const filesDto = fileRecordListResponse.map((record: FileDomainObjectProps) => {
			const fileDto = FilesStorageClientMapper.mapFileRecordResponseToFileDto(record);

			return fileDto;
		});

		return filesDto;
	}

	public static mapCopyFileListResponseToCopyFilesDto(
		copyFileListResponse: CopyFileDomainObjectProps[]
	): CopyFileDto[] {
		const filesDto = copyFileListResponse.map((response) => {
			const fileDto = FilesStorageClientMapper.mapCopyFileResponseToCopyFileDto(response);

			return fileDto;
		});

		return filesDto;
	}

	public static mapFileRecordResponseToFileDto(fileRecordResponse: FileDomainObjectProps): FileDto {
		const parentType = FilesStorageClientMapper.mapStringToParentType(fileRecordResponse.parentType);
		const fileDto = new FileDto({
			id: fileRecordResponse.id,
			name: fileRecordResponse.name,
			parentType,
			parentId: fileRecordResponse.parentId,
			createdAt: fileRecordResponse.createdAt,
			updatedAt: fileRecordResponse.updatedAt,
		});

		return fileDto;
	}

	public static mapCopyFileResponseToCopyFileDto(response: CopyFileDomainObjectProps): CopyFileDto {
		const dto = new CopyFileDto({
			id: response.id,
			sourceId: response.sourceId,
			name: response.name,
		});

		return dto;
	}

	public static mapStringToParentType(input: string): FileRecordParentType {
		let response: FileRecordParentType;
		const allowedStrings = Object.values(FileRecordParentType);

		if (allowedStrings.includes(input as FileRecordParentType)) {
			response = input as FileRecordParentType;
		} else {
			throw new Error(`Mapping type is not supported. ${input}`);
		}

		return response;
	}
}
