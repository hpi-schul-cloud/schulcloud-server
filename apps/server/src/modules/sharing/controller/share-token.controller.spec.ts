import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@shared/domain';
import { shareTokenFactory } from '@shared/testing/factory/share-token.factory';
import { ShareTokenUC } from '../uc';
import { ShareTokenController } from './share-token.controller';

describe('ShareTokenController', () => {
	let controller: ShareTokenController;
	let uc: DeepMocked<ShareTokenUC>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				{
					provide: ShareTokenUC,
					useValue: createMock<ShareTokenUC>(),
				},
			],
			controllers: [ShareTokenController],
		}).compile();

		controller = module.get(ShareTokenController);
		uc = module.get(ShareTokenUC);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('looking up a token', () => {
		it('should call the use case', async () => {
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const shareToken = shareTokenFactory.buildWithId();
			uc.lookupShareToken.mockResolvedValue(shareToken);

			await controller.lookupShareToken(currentUser, { token: shareToken.token });

			expect(uc.lookupShareToken).toBeCalledWith(currentUser.userId, shareToken.token);
		});

		it('should return the token data', async () => {
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const shareToken = shareTokenFactory.buildWithId();
			uc.lookupShareToken.mockResolvedValue(shareToken);

			const response = await controller.lookupShareToken(currentUser, { token: shareToken.token });

			expect(response).toMatchObject({
				token: shareToken.token,
				parentType: shareToken.parentType,
				parentId: shareToken.parentId,
			});
		});
	});
});
