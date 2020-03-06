// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { colorHtmlToInt, colorIntToHtml } from './journal-processors';

it('Color conversion', () => {
  const testColors = [
    '#aaaaaaaa',
    '#00aaaaaa',
    '#0000aaaa',
    '#000000aa',
    '#00000000',
    '#bb00bbbb',
    '#bb0000bb',
    '#bb000000',
    '#11110011',
    '#11110000',
    '#11111100',
  ];

  for (const color of testColors) {
    expect(color).toEqual(colorIntToHtml(colorHtmlToInt(color)));
  }
});

