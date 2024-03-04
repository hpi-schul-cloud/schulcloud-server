import { setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DomainName, OperationType } from '@shared/domain/types';
import { DeletionLogEntity, DomainOperationReportProps } from './deletion-log.entity';

describe(DeletionLogEntity.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		describe('When constructor is called', () => {
			const setup = () => {
				const props = {
					id: new ObjectId().toHexString(),
					domain: DomainName.USER,
					domainOperationReport: [
						new DomainOperationReportProps({
							operation: OperationType.DELETE,
							count: 1,
							refs: [new ObjectId().toHexString()],
						}),
					],
					domainDeletionReport: new DeletionLogEntity({
						id: new ObjectId().toHexString(),
						domain: DomainName.REGISTRATIONPIN,
						domainOperationReport: [
							new DomainOperationReportProps({
								operation: OperationType.DELETE,
								count: 2,
								refs: [new ObjectId().toHexString(), new ObjectId().toHexString()],
							}),
						],
						deletionRequestId: new ObjectId(),
						createdAt: new Date(),
						updatedAt: new Date(),
					}),
					deletionRequestId: new ObjectId(),
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				return { props };
			};
			it('should throw an error by empty constructor', () => {
				// @ts-expect-error: Test case
				const test = () => new DeletionLogEntity();
				expect(test).toThrow();
			});

			it('should create a deletionLog by passing required properties', () => {
				const { props } = setup();
				const entity: DeletionLogEntity = new DeletionLogEntity(props);

				expect(entity instanceof DeletionLogEntity).toEqual(true);
			});

			it(`should return a valid object with fields values set from the provided complete props object`, () => {
				const { props } = setup();
				const entity: DeletionLogEntity = new DeletionLogEntity(props);

				const entityProps = {
					id: entity.id,
					domain: entity.domain,
					domainOperationReport: entity.domainOperationReport,
					deletionRequestId: entity.deletionRequestId,
					performedAt: entity.performedAt,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				};

				expect(entityProps).toEqual(props);
			});
		});
	});
});
