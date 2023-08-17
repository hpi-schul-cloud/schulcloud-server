import { FileSecurityCheckEntity } from '@shared/domain';

import { FileSecurityCheck } from '../../domain';

export class FileSecurityCheckMapper {
	static mapToDO(entity: FileSecurityCheckEntity): FileSecurityCheck {
		return new FileSecurityCheck({
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			status: entity.status,
			reason: entity.reason,
			requestToken: entity.requestToken,
		});
	}
}
