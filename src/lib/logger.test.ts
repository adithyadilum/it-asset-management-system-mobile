import { logger } from './logger';
import { SessionExpiredError } from '../constants/api';
it('keeps normal session transitions out of error overlays without hiding unexpected failures', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  logger.error('Profile failed', new SessionExpiredError());
  logger.warn('Session ended', new SessionExpiredError());
  expect(error).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled();
  const failure = new Error('Unexpected failure');
  logger.error('Profile failed', failure);
  expect(error).toHaveBeenCalledWith('Profile failed', failure);
  error.mockRestore();
  warn.mockRestore();
});
