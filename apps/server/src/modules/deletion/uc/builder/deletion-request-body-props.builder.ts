import { EntityId } from '@shared/domain';
import { DeletionDomainModel } from '../../domain/types/deletion-domain-model.enum';
import { DeletionRequestBodyProps } from '../../controller/dto';

export class DeletionRequestBodyPropsBuilder {
	static build(domain: DeletionDomainModel, id: EntityId, deleteInMinutes: number): DeletionRequestBodyProps {
		const deletionRequest = {
			targetRef: { domain, id },
			deleteInMinutes,
		};

		return deletionRequest;
	}
}
