import { Injectable } from '@nestjs/common';
import { AuthorizableReferenceType, AuthorizationLoaderService, Rule } from '../type';

@Injectable()
export class AuthorizationInjectionService {
	private readonly authorizationRules: Rule[] = [];

	private readonly referenceLoaders: Map<AuthorizableReferenceType, AuthorizationLoaderService> = new Map();

	injectAuthorizationRule(rule: Rule) {
		this.authorizationRules.push(rule);
	}

	getAuthorizationRules(): Rule[] {
		return this.authorizationRules;
	}

	injectReferenceLoader(referenceType: AuthorizableReferenceType, referenceLoader: AuthorizationLoaderService) {
		this.referenceLoaders.set(referenceType, referenceLoader);
	}

	getReferenceLoader(referenceType: AuthorizableReferenceType): AuthorizationLoaderService | undefined {
		return this.referenceLoaders.get(referenceType);
	}
}
