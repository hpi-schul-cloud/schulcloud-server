import { Test, TestingModule } from '@nestjs/testing';
import { columnBoardFactory, columnFactory, setupEntities } from '@shared/testing';
import { EntityManager } from '@mikro-orm/mongodb';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { RecursiveDeleteVisitor } from './recursive-delete.vistor';

describe(RecursiveDeleteVisitor.name, () => {
	let module: TestingModule;
	let em: DeepMocked<EntityManager>;
	let service: RecursiveDeleteVisitor;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [RecursiveDeleteVisitor, { provide: EntityManager, useValue: createMock<EntityManager>() }],
		}).compile();

		em = module.get(EntityManager);
		service = module.get(RecursiveDeleteVisitor);
		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when used as a visitor on a board composite', () => {
		describe('acceptAsync', () => {
			it('should delete the board node', async () => {
				const board = columnBoardFactory.build();

				await board.acceptAsync(service);

				expect(em.remove).toHaveBeenCalled();
			});

			it('should make the children accept the service', async () => {
				const columns = columnFactory.buildList(2).map((col) => {
					col.acceptAsync = jest.fn();
					return col;
				});
				const board = columnBoardFactory.build({ children: columns });

				await board.acceptAsync(service);

				expect(columns[0].acceptAsync).toHaveBeenCalledWith(service);
				expect(columns[1].acceptAsync).toHaveBeenCalledWith(service);
			});
		});
	});
});
