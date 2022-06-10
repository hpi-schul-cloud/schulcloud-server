/* istanbul ignore file */

import { ScanStatus } from '@shared/domain';
import { FileSecurityCheckData, SyncSourceFileSecurityCheck } from '../types';

export class FileSecurityCheckMapper {
	static mapToDomain(fsData: FileSecurityCheckData): SyncSourceFileSecurityCheck {
		const securityCheck = new SyncSourceFileSecurityCheck({
			status: fsData.status as ScanStatus,
			reason: fsData.reason as string,
			requestToken: fsData.requestToken as string,
			createdAt: fsData.createdAt as Date,
			updatedAt: fsData.updatedAt as Date,
		});

		return securityCheck;
	}
}
