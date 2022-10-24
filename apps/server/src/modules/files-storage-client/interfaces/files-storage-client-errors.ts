import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';

export type FileStorageErrors = ApiValidationError | ForbiddenException | InternalServerErrorException;

export interface IFileStorageErrors extends Error {
	status?: number;
	message: never;
	validationErrors?: [];
}
