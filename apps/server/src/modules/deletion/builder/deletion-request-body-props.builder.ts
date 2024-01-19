import { DomainModel, EntityId } from '@shared/domain/types';
import { DeletionRequestBodyProps } from '../controller/dto';

export class DeletionRequestBodyPropsBuilder {
	static build(domain: DomainModel, id: EntityId, deleteInMinutes?: number): DeletionRequestBodyProps {
		const deletionRequestItem = {
			targetRef: { domain, id },
			deleteInMinutes,
		};

		return deletionRequestItem;
	}
}
