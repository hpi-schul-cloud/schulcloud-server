import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';

export type FileStorageError = ApiValidationError | ForbiddenException | InternalServerErrorException;

export interface IFileStorageError extends Error {
	status?: number;
	message: never;
	validationErrors?: [];
}
