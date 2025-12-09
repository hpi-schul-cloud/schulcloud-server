import { HelpdeskProblem } from '../../domain/do';
import { HelpdeskProblemEntity } from '../helpdesk-problem.entity';

export class HelpdeskProblemMapper {
	static mapToDO(entity: HelpdeskProblemEntity): HelpdeskProblem {
		return new HelpdeskProblem({
			id: entity.id,
			subject: entity.subject,
			currentState: entity.currentState,
			targetState: entity.targetState,
			state: entity.state,
			notes: entity.notes,
			order: entity.order,
			userId: entity.userId,
			schoolId: entity.schoolId,
			forwardedAt: entity.forwardedAt,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
	}

	static mapDOToEntityProperties(domainObject: HelpdeskProblem, entity?: HelpdeskProblemEntity): HelpdeskProblemEntity {
		if (entity) {
			entity.subject = domainObject.subject;
			entity.currentState = domainObject.props.currentState;
			entity.targetState = domainObject.props.targetState;
			entity.state = domainObject.state;
			entity.notes = domainObject.notes;
			entity.order = domainObject.props.order;
			entity.userId = domainObject.userId;
			entity.schoolId = domainObject.schoolId;
			entity.forwardedAt = domainObject.props.forwardedAt;
			return entity;
		}

		return new HelpdeskProblemEntity({
			subject: domainObject.subject,
			currentState: domainObject.props.currentState,
			targetState: domainObject.props.targetState,
			state: domainObject.state,
			notes: domainObject.notes,
			order: domainObject.props.order,
			userId: domainObject.userId,
			schoolId: domainObject.schoolId,
			forwardedAt: domainObject.props.forwardedAt,
		});
	}
}
