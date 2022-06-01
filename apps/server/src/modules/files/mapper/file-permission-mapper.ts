import { ObjectId } from '@mikro-orm/mongodb';
import { FilePermissionData, SyncSourceFilePermission } from '../types';

export class FilePermissionSchemaMapper {
	static mapToDomain(fpData: FilePermissionData): SyncSourceFilePermission {
		const permission = new SyncSourceFilePermission({
			refId: (fpData.refId as ObjectId)?.toHexString(),
			refPermModel: fpData.refPermModel as string,
			write: fpData.write as boolean,
			read: fpData.read as boolean,
			create: fpData.create as boolean,
			delete: fpData.delete as boolean,
		});
		return permission;
	}
}
