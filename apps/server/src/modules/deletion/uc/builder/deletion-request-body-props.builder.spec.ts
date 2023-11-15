import { DeletionDomainModel } from '../../domain/types/deletion-domain-model.enum';
import { DeletionRequestBodyPropsBuilder } from './deletion-request-body-props.builder';

describe(DeletionRequestBodyPropsBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});

	it('should build generic deletionRequestBodyParams with all attributes', () => {
		// Arrange
		const domain = DeletionDomainModel.PSEUDONYMS;
		const refId = '653e4833cc39e5907a1e18d2';
		const deleteInMinutes = 1000;

		const result = DeletionRequestBodyPropsBuilder.build(domain, refId, deleteInMinutes);

		// Assert
		expect(result.targetRef.domain).toEqual(domain);
		expect(result.targetRef.id).toEqual(refId);
		expect(result.deleteInMinutes).toEqual(deleteInMinutes);
	});
});
