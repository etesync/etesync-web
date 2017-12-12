import { entries, createEntries, fetchEntries } from './store';

import * as EteSync from './api/EteSync';

it('Entries reducer', () => {
  const jId = '24324324324';
  let state = {};

  let entry = new EteSync.Entry();
  entry.deserialize({
    content: 'someContent',
    uid: '6355209e2a2c26a6c1e6e967c2032737d538f602cf912474da83a2902f8a0a83'
  });

  let action = {
    type: fetchEntries.toString(),
    meta: {journal: jId, prevUid: null},
    payload: [entry],
  };

  state = entries(state, action as any);
  expect(state[jId].value[0].serialize()).toEqual(entry.serialize());

  // We replace if there's no prevUid
  state = entries(state, action as any);
  expect(state[jId].value[0].serialize()).toEqual(entry.serialize());
  expect(state[jId].value.length).toBe(1);

  // We extend if prevUid is set
  action.meta.prevUid = entry.uid;
  state = entries(state, action as any);
  expect(state[jId].value.length).toBe(2);

  // Creating entries should also work the same
  action.type = createEntries.toString();
  state = entries(state, action as any);
  expect(state[jId].value.length).toBe(3);
});
