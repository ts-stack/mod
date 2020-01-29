import { mergeOpts } from '../../src/utils/merge-arrays-options';

describe('mergeOpts()', () => {
  it('should merge with undefined', () => {
    const defaults = ['one', 'two'];
    const options = undefined;
    const result = mergeOpts(defaults, options);
    expect(result).toEqual(defaults);
  });

  it('should merge with another array', () => {
    const defaults = ['one', 'two'];
    const options = ['three'];
    const result = mergeOpts(defaults, options);
    expect(result).toEqual(['one', 'two', 'three']);
  });
});