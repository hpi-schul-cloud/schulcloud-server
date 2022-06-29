import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';

export type FileStorageErrors = ApiValidationError | ForbiddenException | InternalServerErrorException;