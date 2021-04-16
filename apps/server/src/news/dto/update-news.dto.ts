import { PartialType } from '@nestjs/mapped-types';
import { CreateNewsDto } from './create-news.dto';

/**
 * DTO for Updating a news document.
 * A PartialType is a halper which allows to extend an existing class by making all its properties optional.
 */
export class UpdateNewsDto extends PartialType(CreateNewsDto) {}
