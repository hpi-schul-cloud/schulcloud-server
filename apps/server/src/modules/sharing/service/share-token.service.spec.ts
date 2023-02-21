import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, lessonFactory, setupEntities, shareTokenFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { CourseService } from '@src/modules/learnroom/service/course.service';
import { LessonService } from '@src/modules/lesson/service';
import { TokenGenerator } from './token-generator.service';
import { ShareTokenService } from './share-token.service';
import { ShareTokenRepo } from '../repo/share-token.repo';
import { ShareTokenContextType, ShareTokenParentType } from '../domainobject/share-token.do';

const buildId = () => new ObjectId().toHexString();

describe('ShareTokenService', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let service: ShareTokenService;
	let generator: DeepMocked<TokenGenerator>;
	let repo: DeepMocked<ShareTokenRepo>;
	let courseService: DeepMocked<CourseService>;
	let lessonService: DeepMocked<LessonService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ShareTokenService,
				{
					provide: TokenGenerator,
					useValue: createMock<TokenGenerator>(),
				},
				{
					provide: ShareTokenRepo,
					useValue: createMock<ShareTokenRepo>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
				},
			],
		}).compile();

		service = await module.get(ShareTokenService);
		generator = await module.get(TokenGenerator);
		repo = await module.get(ShareTokenRepo);
		courseService = await module.get(CourseService);
		lessonService = await module.get(LessonService);
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	describe('createToken', () => {
		it('should create a token', () => {
			const courseId = buildId();

			const token = service.createToken({ parentId: courseId, parentType: ShareTokenParentType.Course });

			expect(token).toBeDefined();
		});

		it('should use the token generator', async () => {
			const courseId = buildId();

			const token = 'share-token';
			generator.generateShareToken.mockReturnValue(token);

			await service.createToken({ parentId: courseId, parentType: ShareTokenParentType.Course });

			expect(generator.generateShareToken).toBeCalled();
			expect(token).toEqual(token);
		});

		it('should use the repo to persist the shareToken', async () => {
			const courseId = buildId();

			await service.createToken({ parentId: courseId, parentType: ShareTokenParentType.Course });

			expect(repo.save).toBeCalled();
		});

		it('should add context to shareToken', async () => {
			const schoolId = buildId();
			const courseId = buildId();
			const context = {
				contextType: ShareTokenContextType.School,
				contextId: schoolId,
			};

			await service.createToken(
				{
					parentId: courseId,
					parentType: ShareTokenParentType.Course,
				},
				{
					context,
				}
			);

			expect(repo.save).toBeCalledWith(expect.objectContaining({ context }));
		});
	});

	describe('lookup', () => {
		it('should lookup a shareToken using a token', async () => {
			const shareToken = shareTokenFactory.build();
			repo.findOneByToken.mockResolvedValue(shareToken);

			const result = await service.lookupToken(shareToken.token);

			expect(result).toEqual(shareToken);
		});

		it('should throw an error when token is invalid', async () => {
			repo.findOneByToken.mockRejectedValue(new NotFoundException());

			const lookupToken = async () => service.lookupToken('invalid-token');

			await expect(lookupToken).rejects.toThrowError(NotFoundException);
		});

		it('should throw an error when shareToken is expired', async () => {
			const shareToken = shareTokenFactory.build({ expiresAt: new Date(Date.now() - 10000) });
			repo.findOneByToken.mockResolvedValue(shareToken);

			const lookupToken = async () => service.lookupToken(shareToken.token);

			await expect(lookupToken).rejects.toThrowError();
		});
	});

	describe('lookup with parent name', () => {
		it('when parent is course', async () => {
			const course = courseFactory.buildWithId();
			courseService.findById.mockResolvedValue(course);

			const payload = { parentId: course.id, parentType: ShareTokenParentType.Course };
			const shareToken = shareTokenFactory.build({ payload });
			repo.findOneByToken.mockResolvedValue(shareToken);

			const result = await service.lookupTokenWithParentName(shareToken.token);

			expect(result).toEqual({ shareToken, parentName: course.name });
		});

		it('when parent is lesson', async () => {
			const lesson = lessonFactory.buildWithId();
			lessonService.findById.mockResolvedValue(lesson);

			const payload = { parentId: lesson.id, parentType: ShareTokenParentType.Lesson };
			const shareToken = shareTokenFactory.build({ payload });
			repo.findOneByToken.mockResolvedValue(shareToken);

			const result = await service.lookupTokenWithParentName(shareToken.token);

			expect(result).toEqual({ shareToken, parentName: lesson.name });
		});
	});
});
