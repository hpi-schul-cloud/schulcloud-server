import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { schoolFactory, setupEntities, taskFactory } from '@shared/testing';
import { FileDto, FilesStorageClientAdapterService } from '@src/modules';
import { FileRecordParamsParentTypeEnum } from '@src/modules/files-storage-client/filesStorageApi/v3';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
import { CopyHelperService } from './copy-helper.service';
import { FileCopyAppendService } from './file-copy-append.service';

describe('file copy append service', () => {
	let module: TestingModule;
	let copyService: FileCopyAppendService;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let fileServiceAdapter: DeepMocked<FilesStorageClientAdapterService>;

	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				FileCopyAppendService,
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
			],
		}).compile();

		copyService = module.get(FileCopyAppendService);
		copyHelperService = module.get(CopyHelperService);
		fileServiceAdapter = module.get(FilesStorageClientAdapterService);
	});

	describe('when no files are present', () => {
		const setup = () => {
			const school = schoolFactory.buildWithId();
			const originalTask = taskFactory.buildWithId({ school });
			const taskCopy = taskFactory.buildWithId({ school });
			const copyStatus: CopyStatus = {
				type: CopyElementType.LESSON,
				title: 'Tolle Lesson',
				status: CopyStatusEnum.SUCCESS,
				elements: [
					{
						type: CopyElementType.TASK,
						title: 'Toller Task',
						status: CopyStatusEnum.SUCCESS,
						originalEntity: originalTask,
						copyEntity: taskCopy,
					},
				],
			};
			const jwt = 'super';
			return { copyStatus, jwt };
		};

		it('should not change status', async () => {
			const { copyStatus, jwt } = setup();
			const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
			expect(updatedCopyStatus).toEqual(copyStatus);
		});
	});

	describe('when taskstatus is failed before appending files', () => {
		const setup = () => {
			const school = schoolFactory.buildWithId();
			const originalTask = taskFactory.buildWithId({ school });
			const taskCopy = taskFactory.buildWithId({ school });
			const copyStatus: CopyStatus = {
				type: CopyElementType.LESSON,
				title: 'Tolle Lesson',
				status: CopyStatusEnum.FAIL,
				elements: [
					{
						type: CopyElementType.TASK,
						title: taskCopy.name,
						status: CopyStatusEnum.FAIL,
						originalEntity: originalTask,
					},
				],
			};
			const copyStatusMockResult = CopyStatusEnum.NOT_IMPLEMENTED;
			copyHelperService.deriveStatusFromElements.mockReturnValue(copyStatusMockResult);
			const jwt = 'veryveryverylongstringthatissignedandstuff';
			return { copyStatus, originalTask, taskCopy, jwt, copyStatusMockResult };
		};

		it('it should not try to copy on failed taskstatus', async () => {
			const { copyStatus, jwt } = setup();
			const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
			// const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
			expect(updatedCopyStatus).toEqual(copyStatus);
		});
	});

	describe('when status contains task with files', () => {
		const setup = () => {
			const school = schoolFactory.buildWithId();
			const originalTask = taskFactory.buildWithId({ school });
			const taskCopy = taskFactory.buildWithId({ school });
			const FILENAME1 = 'Tolle Datei';
			const FILENAME2 = 'Tolle Datei 1';
			const copyStatus: CopyStatus = {
				type: CopyElementType.LESSON,
				title: 'Tolle Lesson',
				status: CopyStatusEnum.SUCCESS,
				elements: [
					{
						type: CopyElementType.TASK,
						title: taskCopy.name,
						status: CopyStatusEnum.PARTIAL,
						copyEntity: taskCopy,
						originalEntity: originalTask,
						elements: [
							{
								type: CopyElementType.FILE_GROUP,
								title: 'Tolle Filegroup',
								status: CopyStatusEnum.PARTIAL,
								elements: [
									{
										type: CopyElementType.FILE,
										title: FILENAME1,
										status: CopyStatusEnum.NOT_IMPLEMENTED,
									},
									{
										type: CopyElementType.FILE,
										title: FILENAME2,
										status: CopyStatusEnum.NOT_IMPLEMENTED,
									},
								],
							},
						],
					},
				],
			};
			const fileDtos = [
				new FileDto({
					id: 'some-file-id',
					name: FILENAME1,
					parentType: FileRecordParamsParentTypeEnum.Tasks,
					parentId: 'some-task-id',
					schoolId: school.id,
				}),
				new FileDto({
					id: 'some-file-id2',
					name: FILENAME2,
					parentType: FileRecordParamsParentTypeEnum.Tasks,
					parentId: 'some-task-id',
					schoolId: school.id,
				}),
			];
			fileServiceAdapter.copyFilesOfParent.mockResolvedValue(fileDtos);
			const copyStatusMockResult = CopyStatusEnum.NOT_IMPLEMENTED;
			// copyHelperService.deriveStatusFromElements.mockReturnValue(copyStatusMockResult);
			const jwt = 'veryveryverylongstringthatissignedandstuff';
			return { copyStatus, originalTask, taskCopy, jwt, copyStatusMockResult };
		};
		it('should copy files of task via fileServiceAdapter', async () => {
			const { copyStatus, originalTask, taskCopy, jwt } = setup();
			await copyService.appendFiles(copyStatus, jwt);
			const param = {
				jwt,
				schoolId: originalTask.school.id,
				parentType: FileRecordParamsParentTypeEnum.Tasks,
				parentId: originalTask.id,
			};
			const target = {
				jwt,
				schoolId: taskCopy.school.id,
				parentType: FileRecordParamsParentTypeEnum.Tasks,
				parentId: taskCopy.id,
			};
			expect(fileServiceAdapter.copyFilesOfParent).toHaveBeenCalledWith(param, target);
		});

		it('should update status of lesson', async () => {
			const { copyStatus, jwt, copyStatusMockResult } = setup();
			const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
			expect(updatedCopyStatus.status).toEqual(copyStatusMockResult);
		});

		it('should update status of task', async () => {
			const { copyStatus, jwt, copyStatusMockResult } = setup();
			const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
			const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
			expect(taskStatus?.status).toEqual(copyStatusMockResult);
		});

		it('should update status of filegroup', async () => {
			const { copyStatus, jwt } = setup();
			const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
			const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
			const fileGroupStatus = taskStatus?.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
			expect(fileGroupStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should replace status of copied files', async () => {
			const { copyStatus, jwt } = setup();
			const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
			const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
			const fileGroupStatus = taskStatus?.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
			expect(
				fileGroupStatus?.elements?.every(
					(el) => el.type === CopyElementType.FILE && el.status === CopyStatusEnum.SUCCESS
				)
			).toBeTruthy();
		});

		describe('failing file copy', () => {
			const setup2 = () => {
				const school = schoolFactory.buildWithId();
				const originalTask = taskFactory.buildWithId({ school });
				const taskCopy = taskFactory.buildWithId({ school });
				const FILENAME1 = 'Tolle Datei';
				const FILENAME2 = 'Tolle Datei 1';
				const copyStatus: CopyStatus = {
					type: CopyElementType.LESSON,
					title: 'Tolle Lesson',
					status: CopyStatusEnum.SUCCESS,
					elements: [
						{
							type: CopyElementType.TASK,
							title: taskCopy.name,
							status: CopyStatusEnum.PARTIAL,
							copyEntity: taskCopy,
							originalEntity: originalTask,
							elements: [
								{
									type: CopyElementType.FILE_GROUP,
									title: 'Tolle Filegroup',
									status: CopyStatusEnum.PARTIAL,
									elements: [
										{
											type: CopyElementType.FILE,
											title: FILENAME1,
											status: CopyStatusEnum.NOT_IMPLEMENTED,
										},
										{
											type: CopyElementType.FILE,
											title: FILENAME2,
											status: CopyStatusEnum.NOT_IMPLEMENTED,
										},
									],
								},
							],
						},
					],
				};
				fileServiceAdapter.copyFilesOfParent.mockRejectedValue(new Error());
				const copyStatusMockResult = CopyStatusEnum.PARTIAL;
				// copyHelperService.deriveStatusFromElements.mockReturnValue(copyStatusMockResult);
				const jwt = 'veryveryverylongstringthatissignedandstuff';
				return { copyStatus, originalTask, taskCopy, jwt, copyStatusMockResult };
			};

			it('should return partially failed CopyStatus, if file copy failed', async () => {
				const { copyStatus, jwt, copyStatusMockResult } = setup2();
				const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
				const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
				const fileGroupStatus = taskStatus?.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
				expect(taskStatus?.status).toEqual(copyStatusMockResult);
				expect(fileGroupStatus?.status).toEqual(CopyStatusEnum.FAIL);
			});

			it('should set copy status of files', async () => {
				const { copyStatus, jwt } = setup2();
				const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
				const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
				const fileGroupStatus = taskStatus?.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
				expect(
					fileGroupStatus?.elements?.every(
						(el) => el.type === CopyElementType.FILE && el.status === CopyStatusEnum.FAIL
					)
				).toBeTruthy();
			});

			it('should update status of lesson', async () => {
				const { copyStatus, jwt, copyStatusMockResult } = setup2();
				const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
				expect(updatedCopyStatus.status).toEqual(copyStatusMockResult);
			});

			it('should update status of task', async () => {
				const { copyStatus, jwt, copyStatusMockResult } = setup2();
				const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
				const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
				expect(taskStatus?.status).toEqual(copyStatusMockResult);
			});
		});
	});
});

// ggf. factories für CopyStatus instanzen...
