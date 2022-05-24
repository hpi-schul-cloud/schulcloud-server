import { createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { TaskRepo } from '@shared/repo';
import { fileFactory, fileRecordFactory, setupEntities } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { SyncFilerecordsConsole, TaskToSync } from './sync-filerecords.console';

describe('SyncFilerecordsConsole', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let console: SyncFilerecordsConsole;
	let taskRepo: TaskRepo;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [SyncFilerecordsConsole],
			providers: [
				{
					provide: TaskRepo,
					useValue: {
						getTasksToSync: jest.fn,
					},
				},
				{
					provide: EntityManager,
					useValue: {
						persist: jest.fn,
						flush: jest.fn,
					},
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		console = module.get(SyncFilerecordsConsole);
		taskRepo = module.get(TaskRepo);

		orm = await setupEntities();
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	it('should be defined', () => {
		expect(console).toBeDefined();
	});

	describe('syncFilerecordsForTasks', () => {
		it('should call getTasksToSync', async () => {
			const spy = jest.spyOn(taskRepo, 'getTasksToSync');
			spy.mockResolvedValue([]);

			await console.syncFilerecordsForTasks();

			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('should call updateFilerecordForTask for a task with an existing filerecord', async () => {
			const getTasksToSyncSpy = jest.spyOn(taskRepo, 'getTasksToSync');
			const file = fileFactory.build();
			const filerecord = fileRecordFactory.build();
			const taskToSync = new TaskToSync(new ObjectId(), new ObjectId(), file, filerecord);
			getTasksToSyncSpy.mockResolvedValue([taskToSync]);

			const updateFilerecordsSpy = jest.spyOn(console, 'updateFilerecordForTask');

			await console.syncFilerecordsForTasks();

			expect(updateFilerecordsSpy).toHaveBeenCalledTimes(1);
		});
	});
});
