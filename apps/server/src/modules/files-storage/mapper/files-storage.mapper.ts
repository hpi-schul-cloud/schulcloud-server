import { NotImplementedException, StreamableFile } from '@nestjs/common';
import { AuthorizationBodyParamsReferenceType } from '@src/infra/authorization-client/authorization-api-client';
import { plainToClass } from 'class-transformer';
import {
	DownloadFileParams,
	FileRecordListResponse,
	FileRecordParams,
	FileRecordResponse,
	SingleFileParams,
} from '../controller/dto';
import { FileRecord } from '../entity';
import { FileRecordParentType, GetFileResponse } from '../interface';

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

	public static mapToAllowedAuthorizationEntityType(type: FileRecordParentType): AuthorizationBodyParamsReferenceType {
		const res: AuthorizationBodyParamsReferenceType | undefined = this.authorizationEntityMap.get(type);

		if (!res) {
			throw new NotImplementedException();
		}

		return res;
	}

	public static mapToSingleFileParams(params: DownloadFileParams): SingleFileParams {
		const singleFileParams = { fileRecordId: params.fileRecordId };

		return singleFileParams;
	}

	public static mapFileRecordToFileRecordParams(fileRecord: FileRecord): FileRecordParams {
		const fileRecordParams = plainToClass(FileRecordParams, {
			storageLocationId: fileRecord.storageLocationId,
			storageLocation: fileRecord.storageLocation,
			parentId: fileRecord.parentId,
			parentType: fileRecord.parentType,
		});

		return fileRecordParams;
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
