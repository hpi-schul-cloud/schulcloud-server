import { ObjectId } from '@mikro-orm/mongodb';
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
			const deleteAfterMinutes = 1000;
			return { domain, refId, deleteAfterMinutes };
		};
		it('should build deletionRequestBodyParams with all attributes', () => {
			const { domain, refId, deleteAfterMinutes } = setup();

			const result = DeletionRequestBodyPropsBuilder.build(domain, refId, deleteAfterMinutes);

			// Assert
			expect(result.targetRef.domain).toEqual(domain);
			expect(result.targetRef.id).toEqual(refId);
			expect(result.deleteAfterMinutes).toEqual(deleteAfterMinutes);
		});
	});
});
