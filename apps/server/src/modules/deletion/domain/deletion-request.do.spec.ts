import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionRequest } from './deletion-request.do';
import { DeletionDomainModel } from './types/deletion-domain-model.enum';
import { deletionRequestFactory } from './testing/factory/deletion-request.factory';
import { DeletionStatusModel } from './types/deletion-status-model.enum';

describe(DeletionRequest.name, () => {
	describe('constructor', () => {
		describe('When constructor is called', () => {
			it('should create a deletionRequest by passing required properties', () => {
				const domainObject: DeletionRequest = deletionRequestFactory.build();

				expect(domainObject instanceof DeletionRequest).toEqual(true);
			});
		});

		describe('when passed a valid id', () => {
			const setup = () => {
				const domainObject: DeletionRequest = deletionRequestFactory.buildWithId();

				return { domainObject };
			};

			it('should set the id', () => {
				const { domainObject } = setup();

				const deletionRequestDomainObject: DeletionRequest = new DeletionRequest(domainObject);

				expect(deletionRequestDomainObject.id).toEqual(domainObject.id);
			});
		});
	});

	describe('getters', () => {
		describe('When getters are used', () => {
			it('getters should return proper values', () => {
				const props = {
					id: new ObjectId().toHexString(),
					domain: DeletionDomainModel.USER,
					deleteAfter: new Date(),
					itemId: new ObjectId().toHexString(),
					status: DeletionStatusModel.REGISTERED,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				const deletionRequestDo = new DeletionRequest(props);
				const gettersValues = {
					id: deletionRequestDo.id,
					domain: deletionRequestDo.domain,
					deleteAfter: deletionRequestDo.deleteAfter,
					itemId: deletionRequestDo.itemId,
					status: deletionRequestDo.status,
					createdAt: deletionRequestDo.createdAt,
					updatedAt: deletionRequestDo.updatedAt,
				};

				expect(gettersValues).toEqual(props);
			});
		});
	});
});
