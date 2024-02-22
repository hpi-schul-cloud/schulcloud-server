import { ObjectId } from '@mikro-orm/mongodb';
import { DomainName, OperationType } from '@shared/domain/types';
import { DeletionLogStatisticBuilder, DeletionTargetRefBuilder } from '../../builder';
import { DeletionRequestLogResponse } from './index';
import { DeletionStatusModel } from '../../domain/types';

describe(DeletionRequestLogResponse.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const targetRefDomain = DomainName.PSEUDONYMS;
				const targetRefId = new ObjectId().toHexString();
				const targetRef = DeletionTargetRefBuilder.build(targetRefDomain, targetRefId);
				const status = DeletionStatusModel.SUCCESS;
				const deletionPlannedAt = new Date();
				const operation = OperationType.DELETE;
				const count = 2;
				const refs = [new ObjectId().toHexString(), new ObjectId().toHexString()];
				const statistics = [DeletionLogStatisticBuilder.build(targetRefDomain, operation, count, refs)];

				return { targetRef, deletionPlannedAt, status, statistics };
			};

			it('should set the id', () => {
				const { targetRef, deletionPlannedAt, status, statistics } = setup();

				const deletionRequestLog = new DeletionRequestLogResponse({ targetRef, deletionPlannedAt, status, statistics });

				expect(deletionRequestLog.targetRef).toEqual(targetRef);
				expect(deletionRequestLog.deletionPlannedAt).toEqual(deletionPlannedAt);
				expect(deletionRequestLog.status).toEqual(status);
				expect(deletionRequestLog.statistics).toEqual(statistics);
			});
		});
	});
});
