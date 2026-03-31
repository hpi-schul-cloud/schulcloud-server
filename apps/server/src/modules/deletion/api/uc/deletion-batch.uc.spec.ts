import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AccountService } from '@modules/account';
import { Test, TestingModule } from '@nestjs/testing';
import { DeletionBatchService } from '../../domain/service';
import { deletionBatchFactory } from '../../domain/testing';
import { BatchStatus } from '../../domain/types';
import { CantCreateDeletionRequestsForBatchErrorLoggable } from '../loggable/cant-create-deletion-requests-for-batch-error.loggable';
import { DeletionBatchUc } from './deletion-batch.uc';

describe('DeletionBatchUc', () => {
	let module: TestingModule;
	let uc: DeletionBatchUc;
	let deletionBatchService: DeepMocked<DeletionBatchService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeletionBatchUc,
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: DeletionBatchService,
					useValue: createMock<DeletionBatchService>(),
				},
			],
		}).compile();

		uc = module.get(DeletionBatchUc);
		deletionBatchService = module.get(DeletionBatchService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('requestDeletionForBatch', () => {
		describe('when batch status is not "created"', () => {
			const setup = () => {
				const batch = deletionBatchFactory.buildWithId({ status: BatchStatus.DELETION_REQUESTED });
				deletionBatchService.findById.mockResolvedValue(batch);

				return { batch };
			};

			it('should throw', async () => {
				const { batch } = setup();
				await expect(uc.requestDeletionForBatch(batch.id, new Date())).rejects.toThrow(
					CantCreateDeletionRequestsForBatchErrorLoggable
				);
			});
		});
	});
});
