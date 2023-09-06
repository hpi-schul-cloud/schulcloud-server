import { NotImplementedException, StreamableFile } from '@nestjs/common';
// TODO: it should be internal and unknown outside. If we switch to registration we do not have this information.
// make the mapper method mapToAllowedAuthorizationEntityType sense in this context? If we use and parent type that is not known to run time an error is throw.
// We have no other information. Maybe a enum must be enough.
import { AuthorizableReferenceType } from '@src/modules/authorization/domain/reference/types';
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
			schoolId: fileRecord.schoolId,
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
		const streamableFile = new StreamableFile(fileResponse.data, {
			type: fileResponse.contentType,
			disposition: `inline; filename="${encodeURI(fileResponse.name)}"`,
			length: fileResponse.contentLength,
		});

		return streamableFile;
	}
}
