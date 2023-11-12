import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BaseDO, EntityId, User, PermissionContextEntity } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { ObjectId } from 'bson';


@Injectable()
export class PermissionContextService {
	constructor(private readonly userRepo: UserRepo) {}

    public resolvePermissions(user: User, contextReference: ObjectId): string[] {

        throw "Not implemented";
    }
}