import { EntityId } from '@shared/domain/types';
import { DeletionDomainModel } from '../../domain/types/deletion-domain-model.enum';
import { DeletionTargetRefBuilder } from './deletion-target-ref.builder';

describe('DeletionTargetRefBuilder', () => {
	describe('build', () => {
		it('should return a DeletionTargetRef', () => {
			const targetRefDomain = DeletionDomainModel.USER;
			const targetRefId: EntityId = 'targetRefId';

			const deletionTargetRef = DeletionTargetRefBuilder.build(targetRefDomain, targetRefId);

			expect(deletionTargetRef).toEqual({ targetRefDomain, targetRefId });
		});
	});
});