import { Factory } from 'fishery';
import { BOARD_PLAN_VERSION, type BoardPlan } from '../domain/type';

export const boardPlanFactory = Factory.define<BoardPlan>(() => {
	const plan: BoardPlan = { version: BOARD_PLAN_VERSION, title: 'Board', columns: [] };

	return plan;
});
