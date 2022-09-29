import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, shareTokenFactory, userFactory } from '@shared/testing';
import { ShareTokenService } from '../share-token.service';
import { ShareTokenUC } from './share-token.uc';

describe('ShareTokenUC', () => {
	let orm: MikroORM;
	let uc: ShareTokenUC;
	let service: DeepMocked<ShareTokenService>;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ShareTokenUC,
				{
					provide: ShareTokenService,
					useValue: createMock<ShareTokenService>(),
				},
			],
		}).compile();

		uc = await module.get(ShareTokenUC);
		service = await module.get(ShareTokenService);
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('generate a sharetoken', () => {
		it('should throw NotImplemented for now', async () => {
			const user = userFactory.buildWithId();
			const shareToken = shareTokenFactory.build();
			service.createToken.mockResolvedValue(shareToken);
			await expect(
				uc.createShareToken(user.id, {
					parentId: shareToken.payload.parentId,
					parentType: shareToken.payload.parentType,
				})
			).rejects.toThrow(NotImplementedException);
		});
	});

	describe('look up a sharetoken', () => {
		it('should throw NotImplemented for now', async () => {
			const user = userFactory.buildWithId();
			const shareToken = shareTokenFactory.build();
			service.lookupToken.mockResolvedValue(shareToken);
			await expect(uc.lookupShareToken(user.id, shareToken.token)).rejects.toThrow(NotImplementedException);
		});
	});
});
