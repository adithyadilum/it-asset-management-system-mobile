import * as SecureStore from 'expo-secure-store';

import { acknowledgeAssignment, fetchMyAssets } from './assets';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    headers: new Headers(),
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
  mockSecureStore.getItemAsync.mockResolvedValue('a-token');
});

describe('acknowledgeAssignment', () => {
  it('sends POST to the acknowledge endpoint', async () => {
    // M-01: this was PATCH, which the backend answers with 405, so
    // acknowledging an assignment silently failed every time.
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ success: true }));

    await acknowledgeAssignment(42);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(
      'https://api.example.com/api/v1/assets/assignments/42/acknowledge'
    );
    expect(init.method).toBe('POST');
  });

  it('throws when the server rejects the acknowledgment', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ error: 'Not pending' }, 409));

    await expect(acknowledgeAssignment(42)).rejects.toThrow('Not pending');
  });
});

describe('fetchMyAssets', () => {
  it('splits pending acknowledgments from active assets', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse({
        data: [
          { id: 'a', assignmentId: 1, state: 'assigned' },
          { id: 'b', assignmentId: 2, state: 'pending approval' },
          { id: 'c', assignmentId: 3, state: 'overdue' },
        ],
      })
    );

    const { activeAssets, pendingAssignments } = await fetchMyAssets();

    expect(pendingAssignments.map((a) => a.id)).toEqual(['b']);
    expect(activeAssets.map((a) => a.id)).toEqual(['a', 'c']);
  });

  it('issues a GET', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ data: [] }));

    await fetchMyAssets();

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.example.com/api/v1/assets/my-assets');
    expect(init.method).toBeUndefined();
  });
});
