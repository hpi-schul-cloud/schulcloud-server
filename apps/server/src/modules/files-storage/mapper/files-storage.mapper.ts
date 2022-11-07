import { NotImplementedException } from '@nestjs/common';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { plainToClass } from 'class-transformer';
import {
	DownloadFileParams,
	FileRecordListResponse,
	FileRecordParams,
	FileRecordResponse,
	SingleFileParams,
} from '../controller/dto';
import { FileRecord, FileRecordParent } from '../entity';

export class FilesStorageMapper {
	static mapToAllowedAuthorizationEntityType(type: FileRecordParent): AllowedAuthorizationEntityType {
		const types: Map<FileRecordParent, AllowedAuthorizationEntityType> = new Map();
		types.set(FileRecordParent.Task, AllowedAuthorizationEntityType.Task);
		types.set(FileRecordParent.Course, AllowedAuthorizationEntityType.Course);
		types.set(FileRecordParent.User, AllowedAuthorizationEntityType.User);
		types.set(FileRecordParent.School, AllowedAuthorizationEntityType.School);
		types.set(FileRecordParent.Lesson, AllowedAuthorizationEntityType.Lesson);

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
		const responseFileRecords = fileRecords.map((fileRecord) => {
			return FilesStorageMapper.mapToFileRecordResponse(fileRecord);
		});

		const response = new FileRecordListResponse(responseFileRecords, total, skip, limit);
		return response;
	}
}
