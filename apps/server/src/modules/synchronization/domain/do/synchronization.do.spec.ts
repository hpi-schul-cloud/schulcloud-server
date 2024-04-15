import { ObjectId } from '@mikro-orm/mongodb';
import { Synchronization } from './synchronization.do';
import { synchronizationFactory } from '../testing';
import { SynchronizationStatusModel } from '../types';

describe(Synchronization.name, () => {
	describe('constructor', () => {
		describe('When constructor is called', () => {
			it('should create a sychronizations by passing required properties', () => {
				const domainObject: Synchronization = synchronizationFactory.build();

				expect(domainObject instanceof Synchronization).toEqual(true);
			});
		});

		describe('when passed a valid id', () => {
			const setup = () => {
				const domainObject: Synchronization = synchronizationFactory.buildWithId();

				return { domainObject };
			};

			it('should set the id', () => {
				const { domainObject } = setup();

				const synchronizationsDomainObject: Synchronization = new Synchronization(domainObject);

				expect(synchronizationsDomainObject.id).toEqual(domainObject.id);
			});
		});
	});

	describe('getters', () => {
		describe('When getters are used', () => {
			const setup = () => {
				const props = {
					id: new ObjectId().toHexString(),
					systemId: new ObjectId().toHexString(),
					count: 1,
					failureCause: '',
					status: SynchronizationStatusModel.REGISTERED,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				const synchronizationsDo = new Synchronization(props);

				return { props, synchronizationsDo };
			};

			it('getters should return proper values', () => {
				const { props, synchronizationsDo } = setup();

				const gettersValues = {
					id: synchronizationsDo.id,
					systemId: synchronizationsDo.systemId,
					count: synchronizationsDo.count,
					failureCause: synchronizationsDo?.failureCause,
					status: synchronizationsDo?.status,
					createdAt: synchronizationsDo.createdAt,
					updatedAt: synchronizationsDo.updatedAt,
				};

				expect(gettersValues).toEqual(props);
			});
		});
	});
});
