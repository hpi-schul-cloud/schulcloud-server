import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ShareTokenContextType, ShareTokenParentType } from '@shared/domain';
import { ShareTokenRepo } from '@shared/repo/sharetoken';
import { courseFactory, schoolFactory, setupEntities } from '@shared/testing';
import { shareTokenFactory } from '@shared/testing/factory/share-token.factory';
import { ShareTokenService } from './share-token.service';
import { TokenGenerator } from './token-generator.service';

describe('ShareTokenService', () => {
	let orm: MikroORM;
	let service: ShareTokenService;
	let generator: DeepMocked<TokenGenerator>;
	let repo: DeepMocked<ShareTokenRepo>;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
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
			],
		}).compile();

		service = await module.get(ShareTokenService);
		generator = await module.get(TokenGenerator);
		repo = await module.get(ShareTokenRepo);
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('createToken', () => {
		it('should create a token', () => {
			const course = courseFactory.buildWithId();

			const token = service.createToken({ parentId: course.id, parentType: ShareTokenParentType.Course });

			expect(token).toBeDefined();
		});

		it('should use the token generator', async () => {
			const course = courseFactory.buildWithId();
			const token = 'share-token';
			generator.generateShareToken.mockReturnValue(token);

			await service.createToken({ parentId: course.id, parentType: ShareTokenParentType.Course });

			expect(generator.generateShareToken).toBeCalled();
			expect(token).toEqual(token);
		});

		it('should use the repo to persist the shareToken', async () => {
			const course = courseFactory.buildWithId();

			await service.createToken({ parentId: course.id, parentType: ShareTokenParentType.Course });

			expect(repo.save).toBeCalled();
		});

		it('should add context to shareToken', async () => {
			const school = schoolFactory.buildWithId();
			const course = courseFactory.buildWithId({ school });

			await service.createToken(
				{
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				},
				{
					context: {
						contextType: ShareTokenContextType.School,
						contextId: school.id,
					},
				}
			);

			expect(repo.save).toBeCalledWith(
				expect.objectContaining({ contextType: ShareTokenContextType.School, contextId: school.id })
			);
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
});
