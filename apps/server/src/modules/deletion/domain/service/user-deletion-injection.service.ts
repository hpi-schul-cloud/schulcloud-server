import { Injectable } from '@nestjs/common';
import { UserDeletionService } from '../interface';

@Injectable()
export class UserDeletionInjectionService {
	private readonly userDeletionServices: UserDeletionService[] = [];

	public injectUserDeletionService(userDeletionService: UserDeletionService): void {
		this.userDeletionServices.push(userDeletionService);
	}

	public getUserDeletionServices(): UserDeletionService[] {
		return this.userDeletionServices;
	}
}
