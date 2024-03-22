import { DomainDeletionReport, DomainOperationReport } from '../interface';
import { OperationType } from '../types';

export class OperationReportHelper {
	public static extractOperationReports(reports: DomainDeletionReport[]): DomainOperationReport[] {
		const operationReports: { [key in OperationType]?: DomainOperationReport } = {};

		for (const { operations } of reports) {
			for (const { operation, count, refs } of operations) {
				operationReports[operation] = operationReports[operation] || { operation, count: 0, refs: [] };
				operationReports[operation]!.count += count;
				operationReports[operation]!.refs.push(...refs);
			}
		}

		return Object.values(operationReports).filter((report) => report !== undefined);
	}
}
