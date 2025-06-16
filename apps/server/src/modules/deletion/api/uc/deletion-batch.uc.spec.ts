import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RoleName } from '@modules/role';
import { UserDo, UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'bson';
import { CreateDeletionBatchParams, DeletionBatchService } from '../../domain/service';
import { deletionBatchFactory } from '../../domain/testing';
import { BatchStatus, DomainName } from '../../domain/types';
import { CantCreateDeletionRequestsForBatchErrorLoggable } from '../loggable/cant-create-deletion-requests-for-batch-error.loggable';
import { DeletionBatchUc } from './deletion-batch.uc';

describe('DeletionBatchUc', () => {
	let module: TestingModule;
	let uc: DeletionBatchUc;
	let userService: DeepMocked<UserService>;
	let deletionBatchService: DeepMocked<DeletionBatchService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeletionBatchUc,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: DeletionBatchService,
					useValue: createMock<DeletionBatchService>(),
				},
			],
		}).compile();

		uc = module.get(DeletionBatchUc);
		userService = module.get(UserService);
		deletionBatchService = module.get(DeletionBatchService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('createDeletionBatch', () => {
		describe('when contains students, teachers, and invalid ids', () => {
			const setup = () => {
				const student: UserDo = userDoFactory.buildWithId({
					id: new ObjectId().toHexString(),
					roles: [{ id: 'roleid', name: RoleName.STUDENT }],
				});
				const teacher: UserDo = userDoFactory.buildWithId({
					id: new ObjectId().toHexString(),
					roles: [{ id: 'roleid', name: RoleName.TEACHER }],
				});
				const invalidId = new ObjectId().toHexString();

				const createDeletionBatchParams: CreateDeletionBatchParams = {
					name: 'name',
					targetRefDomain: DomainName.USER,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					targetRefIds: [student.id, teacher.id, invalidId],
				};

				userService.findByIdOrNull
					.mockResolvedValueOnce(student)
					.mockResolvedValueOnce(teacher)
					.mockResolvedValueOnce(null);

				return { createDeletionBatchParams, student, teacher, invalidId };
			};
			it('should call user service to check all ids', async () => {
				const { createDeletionBatchParams, student, teacher, invalidId } = setup();
				await uc.createDeletionBatch(createDeletionBatchParams);

				expect(userService.findByIdOrNull).toHaveBeenCalledTimes(3);
				expect(userService.findByIdOrNull).toHaveBeenCalledWith(student.id);
				expect(userService.findByIdOrNull).toHaveBeenCalledWith(teacher.id);
				expect(userService.findByIdOrNull).toHaveBeenCalledWith(invalidId);
			});
			it('should call service with valid, skipped and invalid ids', async () => {
				const { createDeletionBatchParams, student, teacher, invalidId } = setup();

				await uc.createDeletionBatch(createDeletionBatchParams);

				expect(deletionBatchService.createDeletionBatch).toHaveBeenCalledWith(
					createDeletionBatchParams,
					[student.id, teacher.id],
					[invalidId],
					[]
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
				await expect(uc.createDeletionRequestForBatch(batch.id, new Date())).rejects.toThrow(
					CantCreateDeletionRequestsForBatchErrorLoggable
				);
			});
		});
	});
});
