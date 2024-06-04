import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { NotImplementedException, StreamableFile } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import {
	DownloadFileParams,
	FileRecordListResponse,
	FileRecordParams,
	FileRecordResponse,
	SingleFileParams,
} from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';
import { GetFileResponse } from '../interface';

export class FilesStorageMapper {
	static mapToAllowedAuthorizationEntityType(type: FileRecordParentType): AuthorizableReferenceType {
		const types: Map<FileRecordParentType, AuthorizableReferenceType> = new Map();
		types.set(FileRecordParentType.Task, AuthorizableReferenceType.Task);
		types.set(FileRecordParentType.Course, AuthorizableReferenceType.Course);
		types.set(FileRecordParentType.User, AuthorizableReferenceType.User);
		types.set(FileRecordParentType.School, AuthorizableReferenceType.School);
		types.set(FileRecordParentType.Lesson, AuthorizableReferenceType.Lesson);
		types.set(FileRecordParentType.Submission, AuthorizableReferenceType.Submission);
		types.set(FileRecordParentType.Grading, AuthorizableReferenceType.Submission);
		types.set(FileRecordParentType.BoardNode, AuthorizableReferenceType.BoardNode);

		const res = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}
		return res;
	}

	static mapToSingleFileParams(params: DownloadFileParams): SingleFileParams {
		const singleFileParams = { fileRecordId: params.fileRecordId };

		return singleFileParams;
	}

	static mapFileRecordToFileRecordParams(fileRecord: FileRecord): FileRecordParams {
		const fileRecordParams = plainToClass(FileRecordParams, {
			storageLocationId: fileRecord.storageLocationId,
			storageLocation: fileRecord.storageLocation,
			parentId: fileRecord.parentId,
			parentType: fileRecord.parentType,
		});

		return fileRecordParams;
	}

	static mapToFileRecordResponse(fileRecord: FileRecord): FileRecordResponse {
		return new FileRecordResponse(fileRecord);
	}

	static mapToFileRecordListResponse(
		fileRecords: FileRecord[],
		total: number,
		skip?: number,
		limit?: number
	): FileRecordListResponse {
		const responseFileRecords = fileRecords.map((fileRecord) => FilesStorageMapper.mapToFileRecordResponse(fileRecord));

		const response = new FileRecordListResponse(responseFileRecords, total, skip, limit);
		return response;
	}

	static mapToStreamableFile(fileResponse: GetFileResponse): StreamableFile {
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
