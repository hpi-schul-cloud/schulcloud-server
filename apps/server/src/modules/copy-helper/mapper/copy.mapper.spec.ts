import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyStatusEnum } from '@modules/copy-helper';
import { LessonCopyApiParams } from '@modules/learnroom/controller/dto/lesson/lesson-copy.params';
import { LessonCopyParentParams } from '@modules/lesson';
import { TaskCopyApiParams } from '@modules/task/api/dto/task-copy.params';
import { Test, TestingModule } from '@nestjs/testing';
import { CopyApiResponse } from '../dto/copy.response';
import { CopyMapper } from './copy.mapper';
import { TaskCopyParentParams } from '@modules/task/api/dto';

describe('copy mapper', () => {
	let module: TestingModule;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
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
		it('should only map root element if sub elements have status type SUCCESS', () => {
			const copyStatus = {
				title: 'Test element',
				type: CopyElementType.COURSE || CopyElementType.TASK,
				status: CopyStatusEnum.SUCCESS,
				elements: [{ title: 'Sub element', type: CopyElementType.METADATA, status: CopyStatusEnum.SUCCESS }],
			};
			const result = CopyMapper.mapToResponse(copyStatus);

			expect(result.elements).not.toBeDefined();
		});
		it('should also map sub elements if root element does not have status type SUCCESS', () => {
			const copyStatus = {
				title: 'Test element',
				type: CopyElementType.COURSE || CopyElementType.TASK,
				status: CopyStatusEnum.PARTIAL,
				elements: [{ title: 'Sub element', type: CopyElementType.BOARD, status: CopyStatusEnum.NOT_DOING }],
			};
			const result = CopyMapper.mapToResponse(copyStatus);

			expect(result.elements).toBeDefined();
			if (result.elements) {
				expect(result.elements[0].type).toEqual(CopyElementType.BOARD);
			}
		});
	});

	describe('mapTaskCopyToDomain', () => {
		const userId = new ObjectId().toHexString();

		describe('should map received params to domain', () => {
			it('if only course destination is given', () => {
				const courseId = new ObjectId().toHexString();
				const params: TaskCopyApiParams = {
					courseId,
				};
				const result = CopyMapper.mapTaskCopyToDomain(params, userId);
				const expected: TaskCopyParentParams = {
					courseId,
					lessonId: undefined,
					userId,
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
				const result = CopyMapper.mapTaskCopyToDomain(params, userId);
				const expected: TaskCopyParentParams = {
					courseId,
					lessonId,
					userId,
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
				const userId = new ObjectId().toHexString();
				const result = CopyMapper.mapLessonCopyToDomain(params, userId);
				const expected: LessonCopyParentParams = {
					courseId,
					userId,
				};

				expect(result).toStrictEqual(expected);
			});
		});
	});
});
