import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { BoardApi } from './board-api-client';

@Injectable()
export class BoardClientAdapter {
	constructor(private readonly boardApi: BoardApi, @Inject(REQUEST) private request: Request) {}
}
