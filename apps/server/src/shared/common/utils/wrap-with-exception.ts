import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

export const throwForbiddenIfFalse = (condition: boolean): void => {
	if (!condition) {
		throw new ForbiddenException();
	}
};

export const throwUnauthorizedIfFalse = (condition: boolean): void => {
	if (!condition) {
		throw new UnauthorizedException();
	}
};
