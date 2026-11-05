import React from 'react';
import { Alert } from 'react-native';
import { IssueReportForm } from './IssueReportForm';
import { reportAssetIssue } from '../../../services/issues';
const { create, act } = jest.requireActual('react-test-renderer');
jest.mock('../../../services/issues', () => ({ reportAssetIssue: jest.fn() }));
jest.mock('../../ui/Button', () => ({
  Button: ({ children, ...props }: any) =>
    jest.requireActual('react').createElement('Button', props, children),
}));
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
it('keeps the form open on failure, allows retry, and blocks duplicate submits', async () => {
  let reject: (error: Error) => void = () => {};
  jest.mocked(reportAssetIssue).mockImplementationOnce(
    () =>
      new Promise((_, rejectPromise) => {
        reject = rejectPromise;
      })
  );
  const onSubmitted = jest.fn();
  let tree: any;
  await act(async () => {
    tree = create(
      <IssueReportForm
        assetId="asset"
        assetTag="LAP-42"
        onSubmitted={onSubmitted}
        onCancel={jest.fn()}
      />
    );
  });
  await act(async () => {
    tree.root
      .findByProps({ accessibilityLabel: 'Issue description' })
      .props.onChangeText('  Screen flickers  ');
  });
  const submit = tree.root.findAllByType('Button')[0].props.onPress;
  await act(async () => {
    submit();
    submit();
  });
  expect(reportAssetIssue).toHaveBeenCalledTimes(1);
  expect(reportAssetIssue).toHaveBeenCalledWith('asset', 'Screen flickers');
  await act(async () => {
    reject(new Error('Network unavailable'));
  });
  expect(onSubmitted).not.toHaveBeenCalled();
  expect(
    tree.root.findByProps({ accessibilityRole: 'alert' }).props.children
  ).toContain('Network unavailable');
  jest
    .mocked(reportAssetIssue)
    .mockResolvedValueOnce({ success: true, ticketId: 7 });
  await act(async () => {
    tree.root.findAllByType('Button')[0].props.onPress();
  });
  expect(onSubmitted).toHaveBeenCalledTimes(1);
  await act(async () => tree.unmount());
});
