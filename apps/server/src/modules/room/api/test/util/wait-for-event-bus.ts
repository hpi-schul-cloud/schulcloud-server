export const waitForEventBus = (ms = 20): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
