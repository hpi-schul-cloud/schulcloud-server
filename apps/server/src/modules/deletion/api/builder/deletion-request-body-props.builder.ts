import { type EntityId } from '@shared/domain/types';
import { type DeletionRequestBodyParams } from '../controller/dto';
import { type DomainName } from '../../domain/types';

export class DeletionRequestBodyPropsBuilder {
	public static build(domain: DomainName, id: EntityId, deleteAfterMinutes?: number): DeletionRequestBodyParams {
		const deletionRequestItem = {
			targetRef: { domain, id },
			deleteAfterMinutes,
		};

		return deletionRequestItem;
	}
}
