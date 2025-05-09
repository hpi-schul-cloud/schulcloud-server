import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ModuleName, SagaService } from '@modules/saga';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesStorageProducer } from '../service';
import { DeleteUserFilesStorageDataStep } from './delete-user-files-storage-data.step';

describe(DeleteUserFilesStorageDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserFilesStorageDataStep;
	let client: DeepMocked<FilesStorageProducer>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DeleteUserFilesStorageDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: FilesStorageProducer,
					useValue: createMock<FilesStorageProducer>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		step = module.get(DeleteUserFilesStorageDataStep);
		client = module.get(FilesStorageProducer);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserFilesStorageDataStep(
				sagaService,
				createMock<FilesStorageProducer>(),
				createMock<Logger>()
			);

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.FILES_STORAGE, step);
		});
	});

	describe('removeCreatorIdFromFileRecords', () => {
		describe('when creatorId is deleted successfully', () => {
			const setup = () => {
				const creatorId = new ObjectId().toHexString();

				return { creatorId };
			};

			it('Should call client.removeCreatorIdFromFileRecords', async () => {
				const { creatorId } = setup();

				await step.execute({ userId: creatorId });

				expect(client.removeCreatorIdFromFileRecords).toHaveBeenCalledWith(creatorId);
			});
		});

		describe('when error is thrown', () => {
			const setup = () => {
				const creatorId = new ObjectId().toHexString();

				client.removeCreatorIdFromFileRecords.mockRejectedValue(new Error());

				return { creatorId };
			};

			it('Should call error mapper if throw an error.', async () => {
				const { creatorId } = setup();

				await expect(step.execute({ userId: creatorId })).rejects.toThrowError();
			});
		});
	});
});
