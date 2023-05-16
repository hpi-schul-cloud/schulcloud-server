import { NotImplementedException } from '@nestjs/common';
import { AllowedAuthorizationObjectType } from '@src/modules/authorization';
import { plainToClass } from 'class-transformer';
import {
	DownloadFileParams,
	FileRecordListResponse,
	FileRecordParams,
	FileRecordResponse,
	SingleFileParams,
} from '../controller/dto';
import { FileRecord, FileRecordParentType } from '../entity';

export class FilesStorageMapper {
	static mapToAllowedAuthorizationEntityType(type: FileRecordParentType): AllowedAuthorizationObjectType {
		const types: Map<FileRecordParentType, AllowedAuthorizationObjectType> = new Map();
		types.set(FileRecordParentType.Task, AllowedAuthorizationObjectType.Task);
		types.set(FileRecordParentType.Course, AllowedAuthorizationObjectType.Course);
		types.set(FileRecordParentType.User, AllowedAuthorizationObjectType.User);
		types.set(FileRecordParentType.School, AllowedAuthorizationObjectType.School);
		types.set(FileRecordParentType.Lesson, AllowedAuthorizationObjectType.Lesson);
		types.set(FileRecordParentType.Submission, AllowedAuthorizationObjectType.Submission);
		types.set(FileRecordParentType.BoardNode, AllowedAuthorizationObjectType.BoardNode);

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
}
