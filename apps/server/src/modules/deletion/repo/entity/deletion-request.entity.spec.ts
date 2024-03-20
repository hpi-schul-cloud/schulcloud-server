import { setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { DomainName, StatusModel } from '../../domain/types';
import { DeletionRequestEntity } from './deletion-request.entity';

describe(DeletionRequestEntity.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

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

		return { props };
	};

	describe('constructor', () => {
		describe('When constructor is called', () => {
			it('should throw an error by empty constructor', () => {
				// @ts-expect-error: Test case
				const test = () => new DeletionRequestEntity();
				expect(test).toThrow();
			});

			it('should create a deletionRequest by passing required properties', () => {
				const { props } = setup();
				const entity: DeletionRequestEntity = new DeletionRequestEntity(props);

				expect(entity instanceof DeletionRequestEntity).toEqual(true);
			});

			it(`should return a valid object with fields values set from the provided complete props object`, () => {
				const { props } = setup();
				const entity: DeletionRequestEntity = new DeletionRequestEntity(props);

				const entityProps = {
					id: entity.id,
					targetRefDomain: entity.targetRefDomain,
					deleteAfter: entity.deleteAfter,
					targetRefId: entity.targetRefId,
					status: entity.status,
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt,
				};

				expect(entityProps).toEqual(props);
			});
		});
	});

	describe('executed', () => {
		it('should update status with value success', () => {
			const { props } = setup();
			const entity: DeletionRequestEntity = new DeletionRequestEntity(props);

			entity.executed();

			expect(entity.status).toEqual(StatusModel.SUCCESS);
		});
	});

	describe('failed', () => {
		it('should update status with value failed', () => {
			const { props } = setup();
			const entity: DeletionRequestEntity = new DeletionRequestEntity(props);

			entity.failed();

			expect(entity.status).toEqual(StatusModel.FAILED);
		});
	});

	describe('pending', () => {
		it('should update status with value pending', () => {
			const { props } = setup();
			const entity: DeletionRequestEntity = new DeletionRequestEntity(props);

			entity.pending();

			expect(entity.status).toEqual(StatusModel.PENDING);
		});
	});
});
