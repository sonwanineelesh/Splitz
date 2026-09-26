import { getDaypart, getGreeting } from '../src/utils/greeting';

describe('daypart', () => {
  it('maps hours to dayparts', () => {
    expect(getDaypart(6)).toBe('morning');
    expect(getDaypart(11)).toBe('morning');
    expect(getDaypart(12)).toBe('afternoon');
    expect(getDaypart(16)).toBe('afternoon');
    expect(getDaypart(17)).toBe('evening');
    expect(getDaypart(21)).toBe('evening');
    expect(getDaypart(22)).toBe('night');
    expect(getDaypart(4)).toBe('night');
  });
});

describe('greeting', () => {
  it('is stable for the same day and varies the base over days', () => {
    const a = new Date(2026, 8, 26, 9, 0, 0);
    const b = new Date(2026, 8, 26, 10, 30, 0);
    const c = new Date(2026, 8, 27, 9, 0, 0);
    expect(getGreeting(a, 0, 1)).toBe(getGreeting(b, 0, 1));
    expect(getGreeting(a, 0, 1)).not.toBe(getGreeting(c, 0, 1));
  });

  it('reflects live balance context', () => {
    const morning = new Date(2026, 8, 26, 9, 0, 0);
    expect(getGreeting(morning, 124000, 2)).toMatch(/owed ₹1,240/);
    expect(getGreeting(morning, -32000, 2)).toMatch(/₹320 to settle/);
    expect(getGreeting(morning, 0, 2)).toMatch(/all settled up/);
    expect(getGreeting(morning, 500, 0)).toMatch(/split something/);
  });
});
