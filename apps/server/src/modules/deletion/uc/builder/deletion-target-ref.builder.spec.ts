import { EntityId } from '@shared/domain/types';
import { DeletionTargetRefBuilder } from '.';
import { DeletionDomainModel } from '../../domain/types';

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
