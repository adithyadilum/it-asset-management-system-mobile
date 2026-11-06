import { fetchApi } from '../constants/api';
import {
  assignmentAction,
  createHandover,
  fetchTasks,
  inspectReturn,
  searchRecipients,
} from './operations';
jest.mock('../constants/api', () => ({ fetchApi: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
it('encodes task and recipient search parameters', async () => {
  jest.mocked(fetchApi).mockResolvedValue({ data: [] });
  await fetchTasks(
    { kind: 'returns', query: 'LAP_001 & Dell', pageSize: 5 },
    2
  );
  const url = new URL(
    jest.mocked(fetchApi).mock.calls[0][0],
    'https://example.test'
  );
  expect(url.searchParams.get('query')).toBe('LAP_001 & Dell');
  expect(url.searchParams.get('kind')).toBe('returns');
  expect(url.searchParams.get('page')).toBe('2');
  await searchRecipients('user', 'Nimasha & Kasun');
  expect(fetchApi).toHaveBeenLastCalledWith(
    '/api/v1/operations/recipients?type=user&query=Nimasha+%26+Kasun'
  );
});
it('sends guarded mutations once and surfaces ambiguous failures for user review', async () => {
  jest.mocked(fetchApi).mockRejectedValue(new Error('Connection closed'));
  const body = {
    assetId: 'asset',
    expectedUpdatedAt: '2026-11-06T04:00:00.000Z',
  };
  await expect(
    createHandover({ ...body, assignmentType: 'user', targetId: 'user' })
  ).rejects.toThrow('Connection closed');
  expect(fetchApi).toHaveBeenCalledTimes(1);
  await expect(
    assignmentAction(4, { ...body, action: 'receive' })
  ).rejects.toThrow();
  expect(fetchApi).toHaveBeenLastCalledWith(
    '/api/v1/operations/assignments/4',
    { method: 'POST', body: { ...body, action: 'receive' } }
  );
  await expect(
    inspectReturn({
      ...body,
      condition: 'Beyond Repair',
      physicalCondition: 'Damaged',
    })
  ).rejects.toThrow();
  expect(fetchApi).toHaveBeenCalledTimes(3);
});
