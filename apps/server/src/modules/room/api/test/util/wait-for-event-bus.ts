export const waitForEventBus = (ms = 10): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
