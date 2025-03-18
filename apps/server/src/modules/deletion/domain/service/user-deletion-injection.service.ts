import { Injectable } from '@nestjs/common';
import { DeletionService } from '../interface';

@Injectable()
export class UserDeletionInjectionService {
	private readonly userDeletionServices: DeletionService[] = [];

	public injectUserDeletionService(userDeletionService: DeletionService): void {
		this.userDeletionServices.push(userDeletionService);
	}

	public getUserDeletionServices(): DeletionService[] {
		return this.userDeletionServices;
	}
}
