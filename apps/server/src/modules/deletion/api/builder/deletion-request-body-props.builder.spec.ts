import { ObjectId } from 'bson';
import { DeletionRequestBodyPropsBuilder } from '.';
import { DomainName } from '../../domain/types';

describe(DeletionRequestBodyPropsBuilder.name, () => {
	afterAll(() => {
		jest.clearAllMocks();
	});
	describe('when create deletionRequestBodyParams', () => {
		const setup = () => {
			const domain = DomainName.PSEUDONYMS;
			const refId = new ObjectId().toHexString();
			const deleteInMinutes = 1000;
			return { domain, refId, deleteInMinutes };
		};
		it('should build deletionRequestBodyParams with all attributes', () => {
			const { domain, refId, deleteInMinutes } = setup();

			const result = DeletionRequestBodyPropsBuilder.build(domain, refId, deleteInMinutes);

			// Assert
			expect(result.targetRef.domain).toEqual(domain);
			expect(result.targetRef.id).toEqual(refId);
			expect(result.deleteInMinutes).toEqual(deleteInMinutes);
		});
	});
});
