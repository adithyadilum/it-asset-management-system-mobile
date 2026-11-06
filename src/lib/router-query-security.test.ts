import queryString from 'query-string';
it('preserves encoded asset routes, repeated filters and plus-separated search', () => {
  const parsed = queryString.parse(
    'assetId=LAP%2F104&query=Dell+Latitude&tag=hardware&tag=assigned'
  );
  expect(parsed).toEqual({
    assetId: 'LAP/104',
    query: 'Dell Latitude',
    tag: ['hardware', 'assigned'],
  });
  expect(queryString.parse(queryString.stringify(parsed))).toEqual(parsed);
});
it('handles malformed encoding without crashing native route parsing', () => {
  expect(queryString.parse('name=%41%FF%42')).toEqual({ name: 'A%FFB' });
});
