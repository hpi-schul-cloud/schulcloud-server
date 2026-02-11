import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ImportCourseParams, CommonCartridgeEvents, CommonCartridgeExchange } from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';
import { JwtExtractor } from '@shared/common/utils';
import { Options } from 'amqplib';
import { Request } from 'express';

@Injectable()
export class CommonCartridgeProducer {
	constructor(private readonly amqpConnection: AmqpConnection) {}

	public async importCourse(req: Request, message: ImportCourseParams): Promise<void> {
		await this.amqpConnection.publish(
			CommonCartridgeExchange,
			CommonCartridgeEvents.IMPORT_COURSE,
			message,
			this.getPublishOptions(req)
		);
	}

	private getPublishOptions(req: Request): Options.Publish {
		const options: Options.Publish = {
			headers: { Authorization: `Bearer ${JwtExtractor.extractJwtFromRequest(req) ?? ''}` },
		};

		return options;
	}
}
