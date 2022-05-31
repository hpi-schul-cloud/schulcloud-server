import { ObjectId } from '@mikro-orm/mongodb';
import { FilePermissionData, FileSecurityCheckData, SyncSourceFile, SyncSourceFileData } from '../types';
import { FileSecurityCheckMapper } from './file-security-check.mapper';
import { FilePermissionSchemaMapper } from './file-permission-mapper';

export class SyncSourceFileMapper {
	static mapToDomain(file: SyncSourceFileData): SyncSourceFile {
		const source = new SyncSourceFile({
			id: (file._id as ObjectId).toHexString(),
			name: file.name as string,
			size: file.size as number,
			type: file.type as string,
			storageFileName: file.storageFileName as string,
			bucket: file.bucket as string,
			storageProviderId: (file.storageProviderId as ObjectId).toHexString(),
			securityCheck: FileSecurityCheckMapper.mapToDomain(file.securityCheck as FileSecurityCheckData),
			permissions: (file.permissions as FilePermissionData[]).map((fpData) =>
				FilePermissionSchemaMapper.mapToDomain(fpData)
			),
			createdAt: file.createdAt as Date,
			updatedAt: file.updatedAt as Date,
			deletedAt: file.deletedAt as Date,
		});

		return source;
	}
}
