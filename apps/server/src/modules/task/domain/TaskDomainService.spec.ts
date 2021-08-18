import { EntityArray, TaskTestHelper } from '../utils';

import { TaskDomainService } from './TaskDomainService';

const prepareBaseData = (studentNumber?: number) => {
	const helper = new TaskTestHelper();
	const parent1 = helper.createTaskParent(undefined, studentNumber);
	const parent2 = helper.createTaskParent(undefined, studentNumber);
	const task1e1 = helper.createTask(parent1.id);
	const task1e2 = helper.createTask(parent1.id);
	const task2e1 = helper.createTask(parent2.id);
	const task2e2 = helper.createTask(parent2.id);

	const parents = new EntityArray([parent1, parent2]);
	const tasks = [task1e1, task1e2, task2e1, task2e2];
	return {
		parents,
		tasks,
		helper,
	};
};

describe('TaskDomainService', () => {
	describe('constructor', () => {
		it('should work with emptry array inputs', () => {
			const parents = new EntityArray([]);
			const tasks = [];

			const domain = new TaskDomainService(parents, tasks);

			expect(domain).toBeDefined();
		});

		it('should work with filled array inputs', () => {
			const { parents, tasks } = prepareBaseData();

			const domain = new TaskDomainService(parents, tasks);

			expect(domain).toBeDefined();
		});
	});

	describe('addParentToTasks', () => {
		it('should work with existing parent', () => {
			const { parents, tasks } = prepareBaseData();
			const domain = new TaskDomainService(parents, tasks);

			domain.addParentToTasks();

			expect(domain.tasks[0].getParent()).toEqual(parents[0]);
			expect(domain.tasks[1].getParent()).toEqual(parents[0]);
			expect(domain.tasks[2].getParent()).toEqual(parents[1]);
			expect(domain.tasks[3].getParent()).toEqual(parents[1]);
		});

		it('should work with not existing parent', () => {
			const { tasks } = prepareBaseData();
			const parents = new EntityArray([]);
			const domain = new TaskDomainService(parents, tasks);

			domain.addParentToTasks();

			expect(domain.tasks[0].getParent()).toEqual({});
			expect(domain.tasks[1].getParent()).toEqual({});
			expect(domain.tasks[2].getParent()).toEqual({});
			expect(domain.tasks[3].getParent()).toEqual({});
		});
	});

	describe('computeStatusForStudents', () => {
		it('should compute status for each task', () => {
			const { parents, tasks, helper } = prepareBaseData();
			const domain = new TaskDomainService(parents, tasks);

			const submission1 = helper.createSubmission(tasks[0]);
			const submission2 = helper.createSubmission(tasks[1]);
			const submission3 = helper.createSubmission(tasks[2]);
			// 4 has no submission

			const result = domain.computeStatusForStudents([submission1, submission2, submission3]);

			const expected = {
				graded: 0,
				maxSubmissions: 1,
				submitted: 1,
			};

			expect(result[0].status).toEqual(expected);
			expect(result[1].status).toEqual(expected);
			expect(result[2].status).toEqual(expected);
			expect(result[3].status).toEqual({
				graded: 0,
				maxSubmissions: 1,
				submitted: 0,
			});
		});

		// should we handle wrong data inputs, or bind the userId to make it saver?
		it('should always set maxSubmissions to one', () => {
			const { parents, tasks, helper } = prepareBaseData();
			const domain = new TaskDomainService(parents, tasks);
			helper.createAndAddUser();

			const submissions = helper.createSubmissionsForEachStudent(tasks[0]);

			const result = domain.computeStatusForStudents(submissions);

			const expected = {
				graded: 0,
				maxSubmissions: 1,
				submitted: 2,
			};

			expect(result[0].status).toEqual(expected);
		});
	});

	describe('computeStatusForTeachers', () => {
		it('should compute status for each task', () => {
			const maxSubmissions = 30;

			const { parents, tasks, helper } = prepareBaseData(maxSubmissions);
			const domain = new TaskDomainService(parents, tasks);
			helper.createAndAddUser();
			helper.createAndAddUser();

			const submissions1 = helper.createSubmissionsForEachStudent(tasks[0]);
			const submissions2 = helper.createSubmissionsForEachStudent(tasks[1]);
			const submission3 = helper.createSubmission(tasks[2]); // only for first user
			// 4 has no submission

			const result = domain.computeStatusForTeachers([...submissions1, ...submissions2, submission3]);

			expect(result[0].status).toEqual({
				graded: 0,
				maxSubmissions,
				submitted: 3,
			});
			expect(result[1].status).toEqual({
				graded: 0,
				maxSubmissions,
				submitted: 3,
			});
			expect(result[2].status).toEqual({
				graded: 0,
				maxSubmissions,
				submitted: 1,
			});
			expect(result[3].status).toEqual({
				graded: 0,
				maxSubmissions,
				submitted: 0,
			});
		});
	});
});
