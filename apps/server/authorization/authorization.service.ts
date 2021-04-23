import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongoose';

type Permission = 'foo' | 'bar';
type Model = 'school' | 'course' | 'team';
interface Scope {
	targetId: ObjectId;
	targetModel: Model;
}

@Injectable()
export class AuthorizationService {
	hasSchoolPermission(userId: ObjectId, permission: Permission, scope: Scope) {}
	getUserPermissions(userId: ObjectId, scope: Scope) {}
}
