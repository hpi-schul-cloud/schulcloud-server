import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { type ICurrentUser } from '@infra/auth-guard';
import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { PseudonymUc } from '../uc';
import { PseudonymUsernameController } from './pseudonym-username.controller';

describe(PseudonymUsernameController.name, () => {
	let uc: DeepMocked<PseudonymUc>;
	let controller: PseudonymUsernameController;
	let response: DeepMocked<Response>;

	beforeEach(() => {
		uc = createMock<PseudonymUc>();
		controller = new PseudonymUsernameController(uc);
		response = createMock<Response>();
		response.type.mockReturnValue(response);
	});

	it('returns an interactive page when there is no JWT', async () => {
		const request = { headers: {} } as unknown as Request;

		await controller.showName({ pseudonym: 'opaque' }, request, response);

		expect(uc.resolveNameForUser).not.toHaveBeenCalled();
		expect(response.send).toHaveBeenCalledWith(expect.stringContaining('Namen zeigen'));
		expect(response.send).toHaveBeenCalledWith(expect.stringContaining('document.requestStorageAccess()'));
		expect(response.send).toHaveBeenCalledWith(expect.stringContaining("nameLink.href = '/login/'"));
		expect(response.send).toHaveBeenCalledWith(expect.stringContaining('Bitte melden Sie sich in der Schulcloud an'));
		expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
		expect(response.setHeader).toHaveBeenCalledWith(
			'Content-Security-Policy',
			expect.stringContaining("default-src 'self'")
		);
	});

	it('uses the language cookie for the unauthenticated prompt', async () => {
		const request = { headers: { cookie: 'USER_LANG=en' } } as unknown as Request;

		await controller.showName({ pseudonym: 'opaque' }, request, response);

		expect(response.send).toHaveBeenCalledWith(expect.stringContaining('<html lang="en">'));
		expect(response.send).toHaveBeenCalledWith(expect.stringContaining('Show name'));
	});

	it('returns an escaped name for an authenticated user', async () => {
		const request = {
			headers: { authorization: 'Bearer valid-token' },
			user: { userId: 'requesting-user' } as ICurrentUser,
		} as unknown as Request;
		uc.resolveNameForUser.mockResolvedValueOnce('<Ada> & Lovelace');

		await controller.showName({ pseudonym: 'opaque' }, request, response);

		expect(uc.resolveNameForUser).toHaveBeenCalledWith('requesting-user', 'opaque');
		expect(response.send).toHaveBeenCalledWith(expect.stringContaining('&lt;Ada&gt; &amp; Lovelace'));
		expect(response.send).not.toHaveBeenCalledWith(expect.stringContaining('document.requestStorageAccess()'));
	});

	it('rejects a JWT that did not authenticate', async () => {
		const request = { headers: { cookie: 'jwt=invalid' } } as unknown as Request;

		await expect(controller.showName({ pseudonym: 'opaque' }, request, response)).rejects.toThrow(
			UnauthorizedException
		);
	});
});
