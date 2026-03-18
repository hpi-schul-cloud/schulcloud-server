import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from '@modules/account';
import { RoleName } from '@modules/role';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateDeletionBatchParams, DeletionBatchService } from '../../domain/service';
import { deletionBatchFactory } from '../../domain/testing';
import { BatchStatus, DomainName } from '../../domain/types';
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

	describe('createDeletionBatch', () => {
		describe('when contains students, teachers, and invalid ids', () => {
			const setup = () => {
				const studentId = new ObjectId().toHexString();
				const teacherId = new ObjectId().toHexString();
				const invalidId = new ObjectId().toHexString();

				const createDeletionBatchParams: CreateDeletionBatchParams = {
					name: 'name',
					targetRefDomain: DomainName.USER,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					targetRefIds: [studentId, teacherId, invalidId],
				};

				deletionBatchService.filterUsersByRoles.mockResolvedValue({
					validUserIds: [studentId],
					invalidUserIds: [invalidId],
					skippedUserIds: [teacherId],
				});

				return { createDeletionBatchParams, studentId, teacherId, invalidId };
			};
			it('should call filter method with correct parameters', async () => {
				const { createDeletionBatchParams, studentId, teacherId, invalidId } = setup();
				const allowedUserRoles = [
					RoleName.STUDENT,
					RoleName.COURSESTUDENT,
					RoleName.TEACHER,
					RoleName.COURSETEACHER,
					RoleName.COURSESUBSTITUTIONTEACHER,
					RoleName.ADMINISTRATOR,
					RoleName.COURSEADMINISTRATOR,
				];

				await uc.createDeletionBatch(createDeletionBatchParams);

				expect(deletionBatchService.filterUsersByRoles).toHaveBeenCalledWith(
					[studentId, teacherId, invalidId],
					allowedUserRoles
				);
			});
			it('should call service with valid, skipped and invalid ids', async () => {
				const { createDeletionBatchParams, studentId, teacherId, invalidId } = setup();

				await uc.createDeletionBatch(createDeletionBatchParams);

				expect(deletionBatchService.createDeletionBatch).toHaveBeenCalledWith(
					createDeletionBatchParams,
					[studentId],
					[invalidId],
					[teacherId]
				);
			});
		});
	});

	describe('createDeletionRequestsForBatch', () => {
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
