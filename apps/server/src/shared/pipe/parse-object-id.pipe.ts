import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, EntityId> {
	transform(value: string): string {
		const validObjectId = ObjectId.isValid(value);

		if (!validObjectId) {
			throw new BadRequestException('Invalid ObjectId');
		}

		return value;
	}
}
