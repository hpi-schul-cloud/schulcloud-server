import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import { setupEntities } from '@shared/testing';
import { LessonCopyApiParams } from '@src/modules/learnroom/controller/dto/lesson/lesson-copy.params';
import { LessonCopyParentParams } from '@src/modules/learnroom/uc/lesson-copy.uc';
import { TaskCopyApiParams } from '@src/modules/task/controller/dto/task-copy.params';
import { TaskCopyParentParams } from '@src/modules/task/uc/task-copy.uc';
import { CopyApiResponse } from '../controller/dto/copy.response';
import { CopyMapper } from './copy.mapper';

describe('copy mapper', () => {
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
			providers: [CopyMapper],
		}).compile();
	});

	describe('mapToResponse', () => {
		it('should map status without sub elements into response', () => {
			const copyStatus = {
				title: 'Test element',
				type: CopyElementType.COURSE || CopyElementType.TASK,
				status: CopyStatusEnum.SUCCESS,
			};
			const result = CopyMapper.mapToResponse(copyStatus);

			expect(result instanceof CopyApiResponse).toEqual(true);
		});
		it('should map status with sub elements into response', () => {
			const copyStatus = {
				id: 'id',
				title: 'Test element',
				type: CopyElementType.COURSE || CopyElementType.TASK,
				status: CopyStatusEnum.SUCCESS,
				elements: [{ title: 'Sub element', type: CopyElementType.FILE, status: CopyStatusEnum.NOT_IMPLEMENTED }],
			};
			const result = CopyMapper.mapToResponse(copyStatus);

			expect(result instanceof CopyApiResponse).toEqual(true);
		});
	});

	describe('mapTaskCopyToDomain', () => {
		const jwt = 'jwt';

		describe('should map received params to domain', () => {
			it('if only course destination is given', () => {
				const courseId = new ObjectId().toHexString();
				const params: TaskCopyApiParams = {
					courseId,
				};
				const result = CopyMapper.mapTaskCopyToDomain(params, jwt);
				const expected: TaskCopyParentParams = {
					courseId,
					lessonId: undefined,
					jwt,
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
				const result = CopyMapper.mapTaskCopyToDomain(params, jwt);
				const expected: TaskCopyParentParams = {
					courseId,
					lessonId,
					jwt,
				};

				expect(result).toStrictEqual(expected);
			});
		});
	});

	describe('mapLessonCopyToDomain', () => {
		describe('should map received params to domain', () => {
			it('if course destination is given', () => {
				const courseId = new ObjectId().toHexString();
				const params: LessonCopyApiParams = {
					courseId,
				};
				const result = CopyMapper.mapLessonCopyToDomain(params);
				const expected: LessonCopyParentParams = {
					courseId,
				};

				expect(result).toStrictEqual(expected);
			});
		});
	});
});
