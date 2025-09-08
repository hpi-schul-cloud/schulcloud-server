import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyStatusEnum } from '@modules/copy-helper';
import { CopyFileDto } from '@modules/files-storage-client';
import { LessonCopyApiParams } from '@modules/learnroom/controller/dto/lesson/lesson-copy.params';
import { LessonCopyParentParams } from '@modules/lesson';
import { TaskCopyParentParams } from '@modules/task/api/dto';
import { TaskCopyApiParams } from '@modules/task/api/dto/task-copy.params';
import { Test, TestingModule } from '@nestjs/testing';
import { CopyApiResponse } from '../dto/copy.response';
import { CopyMapper } from './copy.mapper';

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

	describe('mapFileDtosToCopyStatus', () => {
		describe('when all props are present', () => {
			const setup = () => {
				const fileName1 = 'file1.jpg';
				const fileName2 = 'file2.jpg';

				const copyFileDtos = [
					{
						id: new ObjectId().toHexString(),
						name: fileName1,
						sourceId: new ObjectId().toHexString(),
					},
					{
						id: new ObjectId().toHexString(),
						name: fileName2,
						sourceId: new ObjectId().toHexString(),
					},
				];

				return { fileName1, fileName2, copyFileDtos };
			};

			it('should map file dto to copy status', () => {
				const { fileName1, fileName2, copyFileDtos } = setup();

				const result = CopyMapper.mapFileDtosToCopyStatus(copyFileDtos);

				expect(result.length).toEqual(2);
				expect(result[0].type).toEqual(CopyElementType.FILE);
				expect(result[0].status).toEqual(CopyStatusEnum.SUCCESS);
				expect(result[0].title).toEqual(fileName1);

				expect(result[1].type).toEqual(CopyElementType.FILE);
				expect(result[1].status).toEqual(CopyStatusEnum.SUCCESS);
				expect(result[1].title).toEqual(fileName2);
			});
		});

		describe('when name is not present', () => {
			const setup = () => {
				const copyFileDtos = [
					{
						id: new ObjectId().toHexString(),
						sourceId: new ObjectId().toHexString(),
					} as CopyFileDto,
				];

				return { copyFileDtos };
			};

			it('should set title correctly', () => {
				const { copyFileDtos } = setup();

				const result = CopyMapper.mapFileDtosToCopyStatus(copyFileDtos);

				expect(result[0].title).toEqual(`(old fileid: ${copyFileDtos[0].sourceId})`);
			});
		});

		describe('when id is not present', () => {
			const setup = () => {
				const copyFileDtos = [
					{
						name: 'file1.jpg',
						sourceId: new ObjectId().toHexString(),
					} as CopyFileDto,
				];

				return { copyFileDtos };
			};

			it('should set status to fail', () => {
				const { copyFileDtos } = setup();

				const result = CopyMapper.mapFileDtosToCopyStatus(copyFileDtos);

				expect(result[0].status).toEqual(CopyStatusEnum.FAIL);
			});
		});
	});
});
