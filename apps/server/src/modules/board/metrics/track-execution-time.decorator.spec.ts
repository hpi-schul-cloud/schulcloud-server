import { TrackExecutionTime } from './track-execution-time.decorator';

class MockClassWithTrackingFunction {
	trackExecutionTime(methodName: string, executionTime: number) {
		console.log(`Executing method ${methodName} took ${executionTime}ms`);
	}
}
class MockClassWithoutTrackingFunction {
	hello() {
		console.log('Hello');
	}
}

describe('TrackExecutionTimeDecorator', () => {
	describe('track', () => {
		describe('when a tracking function is defined in the target object', () => {
			it('should not throw an exception', () => {
				const decorator = TrackExecutionTime();

				const target = new MockClassWithTrackingFunction();
				expect(() => decorator(target, 'nameOfFunctionBeingTracked', {})).not.toThrow();
			});
		});

		describe('when no tracking function is defined in the target object', () => {
			it('should throw an exception', () => {
				const decorator = TrackExecutionTime();

				const target = new MockClassWithoutTrackingFunction();
				expect(() => decorator(target, 'nameOfFunctionBeingTracked', {})).toThrowError(
					`The class MockClassWithoutTrackingFunction does not implement the required trackExecutionTime method.`
				);
			});
		});
	});
});
