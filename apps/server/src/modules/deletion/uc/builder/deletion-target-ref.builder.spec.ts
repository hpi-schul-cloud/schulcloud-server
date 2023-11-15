import { DeletionDomainModel } from '../../domain/types';
import { DeletionTargetRefBuilder } from './deletion-target-ref.builder';

describe(DeletionTargetRefBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should build generic deletionTargetRef with all attributes', () => {
		// Arrange
		const domain = DeletionDomainModel.PSEUDONYMS;
		const refId = '653e4833cc39e5907a1e18d2';

		const result = DeletionTargetRefBuilder.build(domain, refId);

		// Assert
		expect(result.domain).toEqual(domain);
		expect(result.id).toEqual(refId);
	});
});
