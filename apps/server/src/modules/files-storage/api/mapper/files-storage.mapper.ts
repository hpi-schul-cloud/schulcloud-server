import { AuthorizationBodyParamsReferenceType } from '@infra/authorization-client';
import { NotImplementedException, StreamableFile } from '@nestjs/common';
import { FileRecord } from '../../domain';
import { FileRecordParentType, GetFileResponse, StorageLocation } from '../../domain/interface';
import { FileRecordListResponse, FileRecordResponse } from '../dto';

export class FilesStorageMapper {
	private static authorizationEntityMap: Map<FileRecordParentType, AuthorizationBodyParamsReferenceType> = new Map([
		[FileRecordParentType.Task, AuthorizationBodyParamsReferenceType.TASKS],
		[FileRecordParentType.Course, AuthorizationBodyParamsReferenceType.COURSES],
		[FileRecordParentType.User, AuthorizationBodyParamsReferenceType.USERS],
		[FileRecordParentType.School, AuthorizationBodyParamsReferenceType.SCHOOLS],
		[FileRecordParentType.Lesson, AuthorizationBodyParamsReferenceType.LESSONS],
		[FileRecordParentType.Submission, AuthorizationBodyParamsReferenceType.SUBMISSIONS],
		[FileRecordParentType.Grading, AuthorizationBodyParamsReferenceType.SUBMISSIONS],
		[FileRecordParentType.BoardNode, AuthorizationBodyParamsReferenceType.BOARDNODES],
		[FileRecordParentType.ExternalTool, AuthorizationBodyParamsReferenceType.EXTERNAL_TOOLS],
	]);

	private static storageLocationMap: Map<StorageLocation, AuthorizationBodyParamsReferenceType> = new Map([
		[StorageLocation.INSTANCE, AuthorizationBodyParamsReferenceType.INSTANCES],
		[StorageLocation.SCHOOL, AuthorizationBodyParamsReferenceType.SCHOOLS],
	]);

	public static mapToAllowedAuthorizationEntityType(type: FileRecordParentType): AuthorizationBodyParamsReferenceType {
		const res = this.authorizationEntityMap.get(type);

		if (!res) {
			throw new NotImplementedException();
		}

		return res;
	}
	public static mapToAllowedStorageLocationType(type: StorageLocation): AuthorizationBodyParamsReferenceType {
		const res = this.storageLocationMap.get(type);

		if (!res) {
			throw new NotImplementedException();
		}

		return res;
	}

	public static mapToFileRecordResponse(fileRecord: FileRecord): FileRecordResponse {
		return new FileRecordResponse(fileRecord);
	}

	public static mapToFileRecordListResponse(
		fileRecords: FileRecord[],
		total: number,
		skip?: number,
		limit?: number
	): FileRecordListResponse {
		const responseFileRecords: FileRecordResponse[] = fileRecords.map((fileRecord) =>
			FilesStorageMapper.mapToFileRecordResponse(fileRecord)
		);

		const response = new FileRecordListResponse(responseFileRecords, total, skip, limit);

		return response;
	}

	public static mapToStreamableFile(fileResponse: GetFileResponse): StreamableFile {
		let disposition: string;

		if (fileResponse.contentType === 'application/pdf') {
			disposition = `inline;`;
		} else {
			disposition = `attachment;`;
		}

		const streamableFile = new StreamableFile(fileResponse.data, {
			type: fileResponse.contentType,
			disposition: `${disposition} filename="${encodeURI(fileResponse.name)}"`,
			length: fileResponse.contentLength,
		});

		return streamableFile;
	}
}
