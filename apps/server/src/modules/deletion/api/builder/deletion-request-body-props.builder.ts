import { EntityId } from '@shared/domain/types';
import { DeletionRequestBodyParams } from '../controller/dto';
import { DomainName } from '../../domain/types';

export class DeletionRequestBodyPropsBuilder {
	public static build(domain: DomainName, id: EntityId, deleteAfterMinutes?: number): DeletionRequestBodyParams {
		const deletionRequestItem = {
			targetRef: { domain, id },
			deleteAfterMinutes,
		};

		return deletionRequestItem;
	}
}
