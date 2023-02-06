/* istanbul ignore file */

import { ScanStatus } from '@src/modules/files-storage/repo/filerecord.entity';
import { FileSecurityCheckData, SyncSourceFileSecurityCheck } from '../types';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
export class FileSecurityCheckMapper {
	static mapToDomain(fsData: FileSecurityCheckData): SyncSourceFileSecurityCheck {
		const securityCheck = new SyncSourceFileSecurityCheck({
			status: fsData.status === 'wont-check' ? ScanStatus.PENDING : (fsData.status as ScanStatus),
			reason: fsData.reason as string,
			requestToken: fsData.requestToken as string,
			createdAt: fsData.createdAt as Date,
			updatedAt: fsData.updatedAt as Date,
		});

		return securityCheck;
	}
}
