import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ClassService } from '../service';

@Injectable()
export class ClassUC {
	constructor(private readonly classService: ClassService) {}

	async deleteUserData(userId: EntityId): Promise<number> {
		const updatedClasses = await this.classService.deleteUserDataFromClasses(userId);

		return updatedClasses;
	}
}
