import { Injectable } from '@nestjs/common';
import { ImportUser } from '@shared/domain/entity';
import { ImportUserRepo } from '@shared/repo';

@Injectable()
export class UserImportService {
	constructor(private readonly userImportRepo: ImportUserRepo) {}

	public async saveImportUsers(importUsers: ImportUser[]): Promise<ImportUser[]> {
		await this.userImportRepo.saveImportUsers(importUsers);

		return importUsers;
	}
}
