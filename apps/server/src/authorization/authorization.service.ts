import {
	ImATeapotException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { FeathersServiceProvider } from './feathers-service.provider';

type Permission = 'foo' | 'bar';
type Model = 'school' | 'course' | 'team'; // TODO use it
interface Target {
	targetId: Types.ObjectId;
	targetModel: string;
}

import CompareHelper = require('../../../../src/helper/compare'); // TODO move to lib
const { equal: equalId } = CompareHelper.ObjectId;
@Injectable()
export class AuthorizationService {
	constructor(private feathersServiceProvider: FeathersServiceProvider) {}
	async hasPermission(userId: Types.ObjectId, permission: Permission, scope: Target): Promise<boolean> {
		// const permissions =
		return false;
	}

	async getUserSchoolPermissions(userId: Types.ObjectId, schoolId: Types.ObjectId): Promise<string[]> {
		const user = await this.feathersServiceProvider.get('users', userId);
		if (user == null) throw new NotFoundException(); // user not null

		// test user is school member
		const sameSchool = equalId(schoolId, user.schoolId);
		if (sameSchool && Array.isArray(user.permissions)) {
			return user.permissions;
		}
		return [];
	}

	async getUserPermissions(userId: Types.ObjectId, target: Target): Promise<string[]> {
		const params = { route: { scopeId: target.targetId } };
		if (target.targetModel === 'school') {
			const schoolPermissions = await this.getUserSchoolPermissions(userId, target.targetId);
			// TODO service response is string array?
			return schoolPermissions;
		}
		// otherwise a scope must implement userPermissions:
		// TODO check the service implements userPermissions
		const targetPermissions: string[] = await this.feathersServiceProvider.get(
			`${target.targetModel}/:scopeId/userPermissions/`,
			userId,
			params
		);
		// TODO service response is string array?
		return targetPermissions;
	}
}
