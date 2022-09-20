import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ShareTokenParentType } from '@shared/domain';
import { ShareableRepo } from '@shared/repo/shareable';
import { courseFactory, setupEntities } from '@shared/testing';
import { shareableFactory } from '@shared/testing/factory/shareable.factory';
import { ShareTokenService } from './share-token.service';
import { TokenGenerator } from './token-generator.service';

describe('share-token.service', () => {
	let orm: MikroORM;
	let service: ShareTokenService;
	let generator: DeepMocked<TokenGenerator>;
	let repo: DeepMocked<ShareableRepo>;

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
					provide: ShareableRepo,
					useValue: createMock<ShareableRepo>(),
				},
			],
		}).compile();

		service = await module.get(ShareTokenService);
		generator = await module.get(TokenGenerator);
		repo = await module.get(ShareableRepo);
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('createToken', () => {
		it('should create a token', () => {
			const course = courseFactory.buildWithId();

			const token = service.createToken({ id: course.id, type: ShareTokenParentType.Course });

			expect(token).toBeDefined();
		});

		it('should use the token generator', async () => {
			const course = courseFactory.buildWithId();
			const token = 'share-token';
			generator.generateShareToken.mockReturnValue(token);

			await service.createToken({ id: course.id, type: ShareTokenParentType.Course });

			expect(generator.generateShareToken).toBeCalled();
			expect(token).toEqual(token);
		});

		it('should use the repo to persist the shareable', async () => {
			const course = courseFactory.buildWithId();

			await service.createToken({ id: course.id, type: ShareTokenParentType.Course });

			expect(repo.save).toBeCalled();
		});
	});

	describe('lookup', () => {
		it('should lookup a shareable using a token', async () => {
			const shareable = shareableFactory.build();
			repo.findOneByToken.mockResolvedValue(shareable);

			const result = await service.lookupToken(shareable.token);

			expect(result).toEqual(shareable);
		});

		it('should throw an error when token is invalid', async () => {
			repo.findOneByToken.mockRejectedValue(new NotFoundException());

			const lookupToken = async () => service.lookupToken('invalid-token');

			await expect(lookupToken).rejects.toThrowError(NotFoundException);
		});

		it('should throw an error when shareable is expired', async () => {
			const shareable = shareableFactory.build({ expiresAt: new Date(Date.now() - 10000) });
			repo.findOneByToken.mockResolvedValue(shareable);

			const lookupToken = async () => service.lookupToken(shareable.token);

			await expect(lookupToken).rejects.toThrowError();
		});
	});
});
