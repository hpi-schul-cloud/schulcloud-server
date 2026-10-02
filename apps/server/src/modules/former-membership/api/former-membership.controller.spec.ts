import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import {
	FormerMembershipListItemResponse,
	type FormerMembershipUrlParams,
	TransferAllFormerMembershipsResponse,
	TransferFormerMembershipResponse,
} from './dto';
import { FormerMembershipController } from './former-membership.controller';
import { FormerMembershipUc } from './former-membership.uc';

describe('FormerMembershipController', () => {
	let module: TestingModule;
	let sut: FormerMembershipController;
	let ucMock: DeepMocked<FormerMembershipUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [FormerMembershipController],
			providers: [
				{
					provide: FormerMembershipUc,
					useValue: createMock<FormerMembershipUc>(),
				},
			],
		}).compile();

		sut = module.get(FormerMembershipController);
		ucMock = module.get(FormerMembershipUc);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const currentUser = currentUserFactory.build();
	const params: FormerMembershipUrlParams = { type: 'course', refId: 'course-id' };

	describe('list', () => {
		it("delegates to the uc with the current user's id and returns its items", async () => {
			const items = [
				new FormerMembershipListItemResponse({
					type: 'course',
					refId: 'course-id',
					name: 'My course',
					schoolId: 'school-id',
				}),
			];
			ucMock.list.mockResolvedValueOnce(items);

			const result = await sut.list(currentUser);

			expect(ucMock.list).toHaveBeenCalledWith(currentUser.userId);
			expect(result).toEqual(items);
		});
	});

	describe('transfer', () => {
		it('delegates to the uc and returns the transfer result', async () => {
			const expectedResponse = new TransferFormerMembershipResponse({
				success: true,
				type: 'course',
				refId: 'course-id',
				newRefId: 'new-course-id',
			});
			ucMock.transfer.mockResolvedValueOnce(expectedResponse);

			const result = await sut.transfer(currentUser, params);

			expect(ucMock.transfer).toHaveBeenCalledWith(currentUser.userId, params.type, params.refId);
			expect(result).toEqual(expectedResponse);
		});
	});

	describe('reclaim', () => {
		it('delegates to the uc transfer and returns reclaimed status', async () => {
			const transferResult = new TransferFormerMembershipResponse({
				success: true,
				type: 'course',
				refId: 'course-id',
				newRefId: 'new-course-id',
			});
			ucMock.transfer.mockResolvedValueOnce(transferResult);

			const result = await sut.reclaim(currentUser, params);

			expect(ucMock.transfer).toHaveBeenCalledWith(currentUser.userId, params.type, params.refId);
			expect(result.reclaimed).toBe(true);
			expect(result.newRefId).toBe('new-course-id');
		});
	});

	describe('transferAll', () => {
		it('delegates to the uc transferAll and returns the summary response', async () => {
			const expectedResponse = new TransferAllFormerMembershipsResponse({
				total: 1,
				transferred: 1,
				failed: 0,
				results: [
					new TransferFormerMembershipResponse({
						success: true,
						type: 'course',
						refId: 'course-id',
						newRefId: 'new-course-id',
					}),
				],
			});
			ucMock.transferAll.mockResolvedValueOnce(expectedResponse);

			const result = await sut.transferAll(currentUser);

			expect(ucMock.transferAll).toHaveBeenCalledWith(currentUser.userId);
			expect(result).toEqual(expectedResponse);
		});
	});

	describe('discard', () => {
		it('delegates to the uc discard with no response body', async () => {
			ucMock.discard.mockResolvedValueOnce();

			const result = await sut.discard(currentUser, params);

			expect(ucMock.discard).toHaveBeenCalledWith(currentUser.userId, params.type, params.refId);
			expect(result).toBeUndefined();
		});
	});
});
