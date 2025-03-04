import { Injectable } from '@nestjs/common';
import { DeletionService } from '../interface';

@Injectable()
export class UserDeletionInjectionService {
	private readonly userDeletionServices: DeletionService[] = [];

	public injectUserDeletionService(deletionService: DeletionService): void {
		this.userDeletionServices.push(deletionService);
	}

	public getUserDeletionServices(): DeletionService[] {
		return this.userDeletionServices;
	}
}
