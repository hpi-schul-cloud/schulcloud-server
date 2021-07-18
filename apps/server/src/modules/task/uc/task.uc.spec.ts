import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { PaginationQuery } from '@shared/controller/dto/pagination.query';
import { ResolvedUser } from '@shared/domain/entity';
import { Task } from '../entity';
import { TaskRepo, SubmissionRepo, LessonRepo } from '../repo';
import { TaskUC } from './task.uc';
import { UserFacade, UserModule } from '../../user';

const getUser = () =>
	new ResolvedUser({
		schoolId: new ObjectId().toHexString(),
		firstName: '',
		lastName: '',
		roles: [],
		permissions: [],
	});

describe('TaskService', () => {
	let service: TaskUC;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			// imports: [UserModule],
			providers: [
				TaskUC,
				UserFacade, // TODO: do not work
				{
					provide: UserFacade,
					useValue: {
						async getParentIdsFromGroupList() {
							return Promise.resolve([]);
						},
						extractCourseGroupsFromGroupList() {},
						getGroupsByType() {},
					},
				},
				TaskRepo,
				{
					provide: TaskRepo,
					useValue: {
						async getOpenTaskByCourseListAndLessonList() {
							const tasks: Task[] = [new Task({}), new Task({})];
							return Promise.resolve([tasks, 2]);
						},
					},
				},
				SubmissionRepo,
				{
					provide: SubmissionRepo,
					useValue: {
						async getSubmissionsByTasksList() {
							return Promise.resolve([]);
						},
					},
				},
				LessonRepo,
				{
					provide: LessonRepo,
					useValue: {
						async getPublishedLessonIdsByCourseIds() {
							return Promise.resolve([]);
						},
					},
				},
			],
		}).compile();

		service = module.get(TaskUC);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
		expect(typeof service.findAllOpen).toBe('function');
	});

	describe('findAllOpen', () => {
		it('should return task with statistics', async () => {
			const user = getUser();

			const [tasks, total] = await service.findAllOpen(user, new PaginationQuery());
			expect(total).toEqual(2);
			expect(tasks.length).toEqual(2);
			expect(tasks[0].status).toHaveProperty('submitted');
			expect(tasks[0].status).toHaveProperty('maxSubmissions');
			expect(tasks[0].status).toHaveProperty('graded');
		});

		// TODO: then we should pass different status results for each task
		it('should handle submissions of different tasks seperately', async () => {
			const user = getUser();

			const [tasks, total] = await service.findAllOpen(user, new PaginationQuery());
			expect(total).toEqual(2);
			expect(tasks.length).toEqual(2);
			expect(tasks[0].status?.submitted).toEqual(1);
			expect(tasks[1].status?.submitted).toEqual(1);
		});
	});
});
