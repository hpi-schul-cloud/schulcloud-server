import { ObjectId } from '@mikro-orm/mongodb';
import { deletionRequestFactory } from '../testing';
import { DomainName, StatusModel } from '../types';
import { DeletionRequest } from './deletion-request.do';

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
			const setup = () => {
				const props = {
					id: new ObjectId().toHexString(),
					targetRefDomain: DomainName.USER,
					deleteAfter: new Date(),
					targetRefId: new ObjectId().toHexString(),
					status: StatusModel.REGISTERED,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				const deletionRequestDo = new DeletionRequest(props);

				return { props, deletionRequestDo };
			};

			it('getters should return proper values', () => {
				const { props, deletionRequestDo } = setup();

				const gettersValues = {
					id: deletionRequestDo.id,
					targetRefDomain: deletionRequestDo.targetRefDomain,
					deleteAfter: deletionRequestDo.deleteAfter,
					targetRefId: deletionRequestDo.targetRefId,
					status: deletionRequestDo.status,
					createdAt: deletionRequestDo.createdAt,
					updatedAt: deletionRequestDo.updatedAt,
				};

				expect(gettersValues).toEqual(props);
			});
		});
	});
});
