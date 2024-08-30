import { Injectable } from '@nestjs/common';
import { AuthorizableReferenceType, AuthorizationLoaderService, Rule } from '../type';

@Injectable()
export class AuthorizationInjectionService {
	private readonly authorizationRules: Rule[] = [];

	private readonly referenceLoaders: Map<AuthorizableReferenceType, AuthorizationLoaderService> = new Map();

	private readonly shouldPopulate: Map<AuthorizableReferenceType, boolean> = new Map();

	injectAuthorizationRule(rule: Rule) {
		this.authorizationRules.push(rule);
	}

	getAuthorizationRules(): Rule[] {
		return this.authorizationRules;
	}

	injectReferenceLoader(
		referenceType: AuthorizableReferenceType,
		referenceLoader: AuthorizationLoaderService,
		shouldPopulate = false
	) {
		this.referenceLoaders.set(referenceType, referenceLoader);
		this.shouldPopulate.set(referenceType, shouldPopulate);
	}

	getReferenceLoader(referenceType: AuthorizableReferenceType): AuthorizationLoaderService | undefined {
		return this.referenceLoaders.get(referenceType);
	}

	getShouldPopulate(referenceType: AuthorizableReferenceType): boolean {
		return this.shouldPopulate.get(referenceType) ?? false;
	}
}
