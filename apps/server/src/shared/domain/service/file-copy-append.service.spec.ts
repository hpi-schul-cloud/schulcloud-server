import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { schoolFactory, setupEntities, taskFactory } from '@shared/testing';
import { FilesStorageClientAdapterService } from '@src/modules';
import { FileRecordParamsParentTypeEnum } from '@src/modules/files-storage-client/filesStorageApi/v3';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
import { FileCopyAppendService } from './file-copy-append.service';

describe('file copy append service', () => {
	let module: TestingModule;
	let copyService: FileCopyAppendService;
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
			],
		}).compile();

		copyService = module.get(FileCopyAppendService);
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

	describe('when status contains task with files', () => {
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
						title: taskCopy.name,
						status: CopyStatusEnum.PARTIAL,
						copyEntity: taskCopy,
						originalEntity: originalTask,
						elements: [
							{
								type: CopyElementType.FILE_GROUP,
								title: 'Tolle Fielgroup',
								status: CopyStatusEnum.PARTIAL,
								elements: [
									{
										type: CopyElementType.FILE,
										title: 'Tolle Datei',
										status: CopyStatusEnum.NOT_IMPLEMENTED,
									},
									{
										type: CopyElementType.FILE,
										title: 'Tolle Datei 1',
										status: CopyStatusEnum.NOT_IMPLEMENTED,
									},
								],
							},
						],
					},
				],
			};
			const jwt = 'veryveryverylongstringthatissignedandstuff';
			return { copyStatus, originalTask, taskCopy, jwt };
		};
		it('should copy files of task via fileServiceAdapter', async () => {
			const { copyStatus, originalTask, taskCopy, jwt } = setup();
			const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
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

		it('should update status of task', async () => {
			const { copyStatus, originalTask, taskCopy, jwt } = setup();
			const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
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
			expect(updatedCopyStatus.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should update status of filegroup', () => {
			throw new NotImplementedException();
		});

		it('should replace status of copied files', () => {
			throw new NotImplementedException();
		});
	});
});
