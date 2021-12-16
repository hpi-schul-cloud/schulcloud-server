
import { FilterQuery } from '@mikro-orm/core';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityId, IFindOptions, Counted, ICurrentUser, SortOrder, ImportUser } from '@shared/domain';

import { ImportUserRepo } from '@shared/repo';

@Injectable()
export class UserImportUC {
	constructor(private readonly importUserRepo: ImportUserRepo) {};


	async findAll(currentUser: ICurrentUser, query: FilterQuery<ImportUser>, options?: IFindOptions<ImportUser>): Promise<Counted<ImportUser[]>> {
        // ToDo: authorization

        return this.importUserRepo.findImportUsersAndCount(query, options);

    }
}