import { Injectable } from '@nestjs/common';
import type { AuthorizableReferenceType, AuthorizationLoaderService, Rule } from '../type';

@Injectable()
export class AuthorizationInjectionService {
	private readonly authorizationRules: Rule[] = [];

	private readonly referenceLoaders: Map<AuthorizableReferenceType, AuthorizationLoaderService> = new Map();

	public injectAuthorizationRule(rule: Rule): void {
		this.authorizationRules.push(rule);
	}

	public getAuthorizationRules(): Rule[] {
		return this.authorizationRules;
	}

	public injectReferenceLoader(
		referenceType: AuthorizableReferenceType,
		referenceLoader: AuthorizationLoaderService
	): void {
		this.referenceLoaders.set(referenceType, referenceLoader);
	}

	public getReferenceLoader(referenceType: AuthorizableReferenceType): AuthorizationLoaderService | undefined {
		return this.referenceLoaders.get(referenceType);
	}
}
