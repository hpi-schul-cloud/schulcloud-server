import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import { setupEntities } from '@shared/testing';
import { TaskCopyApiParams } from '../controller/dto/task-copy.params';
import { TaskCopyApiResponse } from '../controller/dto/task-copy.response';
import { TaskCopyParentParams } from '../uc/task-copy.uc';
import { TaskCopyMapper } from './task-copy.mapper';

describe('task copy mapper', () => {
	let module: TestingModule;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterEach(async () => {
		await module.close();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [TaskCopyMapper],
		}).compile();
	});

	describe('mapToResponse', () => {
		it('should map status without sub elements into response', () => {
			const copyStatus = {
				title: 'Test element',
				type: CopyElementType.TASK,
				status: CopyStatusEnum.SUCCESS,
			};
			const result = TaskCopyMapper.mapToResponse(copyStatus);

			expect(result instanceof TaskCopyApiResponse).toEqual(true);
		});
		it('should map status with sub elements into response', () => {
			const copyStatus = {
				title: 'Test element',
				type: CopyElementType.TASK,
				status: CopyStatusEnum.SUCCESS,
				elements: [{ title: 'Sub element', type: CopyElementType.FILE, status: CopyStatusEnum.NOT_DOING }],
			};
			const result = TaskCopyMapper.mapToResponse(copyStatus);

			expect(result instanceof TaskCopyApiResponse).toEqual(true);
		});
	});

	describe('mapTaskCopyToDomain', () => {
		describe('should map received params to domain', () => {
			it('if only course destination is given', () => {
				const courseId = new ObjectId().toHexString();
				const params: TaskCopyApiParams = {
					courseId,
				};
				const result = TaskCopyMapper.mapTaskCopyToDomain(params);
				const expected: TaskCopyParentParams = {
					courseId,
					lessonId: undefined,
				};

				expect(result).toStrictEqual(expected);
			});
			it('if course and lesson destination is given', () => {
				const courseId = new ObjectId().toHexString();
				const lessonId = new ObjectId().toHexString();
				const params: TaskCopyApiParams = {
					courseId,
					lessonId,
				};
				const result = TaskCopyMapper.mapTaskCopyToDomain(params);
				const expected: TaskCopyParentParams = {
					courseId,
					lessonId,
				};

				expect(result).toStrictEqual(expected);
			});
		});
	});
});
