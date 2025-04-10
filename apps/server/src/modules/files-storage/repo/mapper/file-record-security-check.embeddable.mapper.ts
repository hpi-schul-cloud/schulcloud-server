import { FileRecordSecurityCheck } from '../../domain';
import { FileRecordSecurityCheckEmbeddable } from '../file-record.entity';

export class FileRecordSecurityCheckEmbeddableMapper {
	public static mapToEntity(securityCheck: FileRecordSecurityCheck): FileRecordSecurityCheckEmbeddable {
		const embeddable = new FileRecordSecurityCheckEmbeddable({
			status: securityCheck.status,
			reason: securityCheck.reason,
			requestToken: securityCheck.requestToken,
		});

		return embeddable;
	}

	public static mapToDo(embeddable: FileRecordSecurityCheckEmbeddable): FileRecordSecurityCheck {
		const securityCheck = new FileRecordSecurityCheck({
			status: embeddable.status,
			reason: embeddable.reason,
			updatedAt: embeddable.updatedAt,
			requestToken: embeddable.requestToken,
		});

		return securityCheck;
	}
}
