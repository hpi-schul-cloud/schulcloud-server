import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';

/**
 * Check this rule in BC-9292
 */
@Injectable()
export class UserRule implements Rule<User> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}
	// Es wäre möglich isApplicable und hasPermission unter Rule weg zu kapseln, solange es
	// genau dieser Implementierung folgt. instanceof User könnte problematisch sein k.a. was ts ermöglicht
	// zu beachten ist das write und read alles enthält, was für die jeweilige Action zum auflösen notwendig ist.
	// Es gibt aber auch nur genau einen Punkt wo man z.B. read Berechtigung des Users prüfen muss.
	// Die Abweichung der Admin Rule ist eigentlich nur das sie nicht auf die Scope Berechtigung (user Zugehörigkeit) prüft,
	// sondern auf die zusätliche Berechtigung um den Scope auszuhebeln.
	// Die Rule legt in beiden Fällen den äußeren Rahmen fest und kann im UC dann weiter eingeschränkt werden.
	// Die Rules für user, school und Instance sind auch sehr trivial Implementiert.
	// Da die Scope Auflösung auch trivial ist.
	// Die Berechtigung muss aber auf jedenfall hier drin sein um z.B. dem SystemUser zu erlauben, das er alle Dateien löschen darf,
	// aber sich selber nicht editieren kann da er z.B. kein USER_EDIT hat. (Spannend ist es wenn er user editieren soll)
	// Vielleicht ist dann eher ein USER_EDIT_SELF anstelle von user.id === object.id notwendig.
	// Ein ähnlichen Fall haben wir dann bei Schools bei der Sichtbarkeit.
	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof User;

		return isMatched;
	}

	public hasPermission(user: User, object: User, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, object, context);
		}
		if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, object, context);
		}

		return hasPermission;
	}

	private hasReadAccess(user: User, object: User, context: AuthorizationContext): boolean {
		const isOwner = user.id === object.id;
		const isSameSchool = user.getSchoolId() === object.getSchoolId();
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.USER_VIEW,
			...context.requiredPermissions,
		]);

		return (hasPermission && isSameSchool) || isOwner;
	}

	private hasWriteAccess(user: User, object: User, context: AuthorizationContext): boolean {
		const isOwner = user.id === object.id;
		const isSameSchool = user.getSchoolId() === object.getSchoolId();
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.USER_EDIT,
			...context.requiredPermissions,
		]);

		return (hasPermission && isSameSchool) || isOwner;
	}
}
