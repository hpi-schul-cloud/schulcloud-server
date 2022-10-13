import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser, ShareTokenParentType } from '@shared/domain';
import { shareTokenFactory } from '@shared/testing';
import { ShareTokenUC } from '../uc';
import { ShareTokenInfoDto } from '../uc/dto';
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

	describe('creating a token', () => {
		const setup = () => {
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const shareToken = shareTokenFactory.build({ token: 'ctuW1FG0RsTo' });
			uc.createShareToken.mockResolvedValue(shareToken);
			const body = {
				parentType: shareToken.payload.parentType,
				parentId: shareToken.payload.parentId,
				expiresInDays: 7,
				schoolExclusive: true,
			};

			return { currentUser, body, shareToken };
		};

		it('should call the use case', async () => {
			const { currentUser, body } = setup();

			await controller.createShareToken(currentUser, body);

			expect(uc.createShareToken).toBeCalledWith(
				currentUser.userId,
				{
					parentId: body.parentId,
					parentType: body.parentType,
				},
				{
					schoolExclusive: true,
					expiresInDays: 7,
				}
			);
		});

		it('should return the token data', async () => {
			const { currentUser, body, shareToken } = setup();

			const result = await controller.createShareToken(currentUser, body);

			expect(result).toMatchObject({
				token: shareToken.token,
				payload: shareToken.payload,
			});
		});
	});

	describe('looking up a token', () => {
		it('should call the use case', async () => {
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const token = 'ctuW1FG0RsTo';

			await controller.lookupShareToken(currentUser, { token });

			expect(uc.lookupShareToken).toBeCalledWith(currentUser.userId, token);
		});

		it('should return the token data', async () => {
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const shareTokenInfo: ShareTokenInfoDto = {
				token: 'ctuW1FG0RsTo',
				parentType: ShareTokenParentType.Course,
				parentName: 'course #1',
			};

			uc.lookupShareToken.mockResolvedValue(shareTokenInfo);

			const response = await controller.lookupShareToken(currentUser, { token: shareTokenInfo.token });

			expect(response).toMatchObject(shareTokenInfo);
		});
	});
});
