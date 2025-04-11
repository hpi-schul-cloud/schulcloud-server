import { FileRecordSecurityCheck } from '../../domain';
import { FileRecordSecurityCheckEmbeddable } from '../file-record.entity';

export class FileRecordSecurityCheckEmbeddableMapper {
	public static mapEntityToDo(embeddable: FileRecordSecurityCheckEmbeddable): FileRecordSecurityCheck {
		const securityCheck = new FileRecordSecurityCheck({
			status: embeddable.status,
			reason: embeddable.reason,
			updatedAt: embeddable.updatedAt,
			requestToken: embeddable.requestToken,
		});

		return securityCheck;
	}

	public static mapDoToEntity(securityCheck: FileRecordSecurityCheck): FileRecordSecurityCheckEmbeddable {
		const embeddable = new FileRecordSecurityCheckEmbeddable({
			status: securityCheck.status,
			reason: securityCheck.reason,
			requestToken: securityCheck.requestToken,
			updatedAt: securityCheck.updatedAt,
		});

		return embeddable;
	}
}
