import { PartialType } from '@nestjs/swagger';
import { CreateNewsParams } from './create-news.params';

/**
 * DTO for Updating a news document.
 * A PartialType is a halper which allows to extend an existing class by making all its properties optional.
 */
export class UpdateNewsParams extends PartialType(CreateNewsParams) {}
