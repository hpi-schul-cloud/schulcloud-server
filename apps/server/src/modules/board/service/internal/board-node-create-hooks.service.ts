import { Utils } from '@mikro-orm/core';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { firstValueFrom } from 'rxjs';
import { AppointmentFinderContentBody } from '../../controller/dto';
import { AnyBoardNode, AppointmentFinderElement, isAppointmentFinderElement } from '../../domain';
import { BoardNodeService } from '../board-node.service';

@Injectable()
export class BoardNodeCreateHooksService {
	constructor(private boardNodeService: BoardNodeService, private readonly httpService: HttpService) {}

	async afterCreate(boardNode: AnyBoardNode | AnyBoardNode[], user: User): Promise<void> {
		const boardNodes = Utils.asArray(boardNode);

		await Promise.allSettled(boardNodes.map(async (bn) => this.singleAfterCreate(bn, user)));
	}

	private async singleAfterCreate(boardNode: AnyBoardNode, user: User): Promise<void> {
		// TODO improve this e.g. using exhaustive check or discriminated union
		if (isAppointmentFinderElement(boardNode)) {
			await this.afterCreateAppointmentFinderElement(boardNode, user);
		} else {
			// noop
		}

		await Promise.allSettled(boardNode.children.map(async (child) => this.afterCreate(child, user)));
	}

	async afterCreateAppointmentFinderElement(
		appointmentFinderElement: AppointmentFinderElement,
		user: User
	): Promise<void> {
		const fullUserName = `${user.firstName} ${user.lastName}`;
		const today = new Date();
		const formattedDate = today.toISOString().split('T')[0];

		// Use builder or something
		const appointmentData = {
			status: 'started',
			appointmentId: '',
			adminId: '',
			creatorName: fullUserName,
			subject: 'Neue Abstimmung',
			place: '',
			description: '',
			password: null,
			suggestedDates: [
				{
					suggestedDateId: null,
					startDate: formattedDate,
					startTime: null,
					endDate: null,
					endTime: null,
				},
			],
			participants: [],
		};

		// Move to api module?
		// Add correct error handling for httpService
		const result = (await firstValueFrom(
			this.httpService.post('http://localhost:4210/appointment/80248a42-8fe2-4d4a-89da-02e683511f76', appointmentData, {
				headers: {
					'Content-Type': 'application/terminfinder.api-v1+json',
				},
			})
		)) as { data: { appointmentId: string; adminId: string } };
		// Add Mapper

		const content = new AppointmentFinderContentBody();
		content.adminId = result.data.adminId;
		content.appointmentFinderId = result.data.appointmentId;

		await this.boardNodeService.updateContent(appointmentFinderElement, content);
	}
}
