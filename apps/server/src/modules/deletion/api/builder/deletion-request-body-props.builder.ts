import { EntityId } from '@shared/domain/types';
import { DeletionRequestBodyParams } from '../controller/dto';
import { DomainName } from '../../domain/types';

export class DeletionRequestBodyPropsBuilder {
	public static build(domain: DomainName, id: EntityId, deleteInMinutes?: number): DeletionRequestBodyParams {
		const deletionRequestItem = {
			targetRef: { domain, id },
			deleteInMinutes,
		};

		return deletionRequestItem;
	}
}
