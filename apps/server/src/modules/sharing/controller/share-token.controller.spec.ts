import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@modules/authentication';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, setupEntities, shareTokenFactory } from '@shared/testing';
import { ShareTokenParentType } from '../domainobject/share-token.do';
import { ShareTokenUC } from '../uc';
import { ShareTokenInfoDto } from '../uc/dto';
import { ShareTokenController } from './share-token.controller';

describe('ShareTokenController', () => {
	let module: TestingModule;
	let controller: ShareTokenController;
	let uc: DeepMocked<ShareTokenUC>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
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
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
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

	describe('importing a share token', () => {
		const setup = () => {
			const currentUser = { userId: 'userId' } as ICurrentUser;
			const token = 'ctuW1FG0RsTo';
			const course = courseFactory.buildWithId();
			const status: CopyStatus = {
				id: '634d78fc28c2e527f9255119',
				title: 'Spanisch',
				type: CopyElementType.COURSE,
				status: CopyStatusEnum.SUCCESS,
				copyEntity: course,
			};
			uc.importShareToken.mockResolvedValue(status);
			const newName = 'NewName';

			return { currentUser, token, newName, status };
		};

		it('should call the use case', async () => {
			const { currentUser, token, newName } = setup();

			await controller.importShareToken(currentUser, { token }, { newName });

			expect(uc.importShareToken).toBeCalledWith(currentUser.userId, token, newName, undefined);
		});

		it('should return the status response', async () => {
			const { currentUser, token, newName, status } = setup();

			const result = await controller.importShareToken(currentUser, { token }, { newName });

			expect(result).toEqual({
				id: status.copyEntity?.id,
				title: status.title,
				type: status.type,
				status: status.status,
			});
		});
	});
});
