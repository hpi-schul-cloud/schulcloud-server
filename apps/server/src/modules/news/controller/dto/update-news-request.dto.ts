import { PartialType } from '@nestjs/swagger';
import { CreateNewsRequestDto } from './create-news-request.dto';

/**
 * DTO for Updating a news document.
 * A PartialType is a halper which allows to extend an existing class by making all its properties optional.
 */
export class UpdateNewsRequestDto extends PartialType(CreateNewsRequestDto) {}
