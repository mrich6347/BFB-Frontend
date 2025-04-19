import { describe, it, expect, vi } from 'vitest'
import { parseFormattedNumberToDecimal, formatNumberByFormat } from '../numberFormatUtil'
import { useBudgetStore } from '@/stores/budget.store'
import { NumberFormat } from '@/types/DTO/budget.dto'
// Mock the budget store
vi.mock('@/stores/budgetStore', () => ({
  useBudgetStore: vi.fn()
}))

// Helper to mock the store for parse tests
const mockStoreFormat = (format: NumberFormat) => {
  vi.mocked(useBudgetStore).mockReturnValue({
    currentBudget: {
      number_format: format
    }
  } as ReturnType<typeof useBudgetStore>)
}

describe('formatNumberByFormat', () => {
  const testCases = [
    { format: NumberFormat.DOT_COMMA, positive: '1,234,567.89', negative: '-1,234,567.89', small: '0.12' },
    { format: NumberFormat.COMMA_COMMA, positive: '1.234.567,89', negative: '-1.234.567,89', small: '0,12' },
    // Note: DOT_COMMA_THREE uses 3 decimal places
    { format: NumberFormat.DOT_COMMA_THREE, positive: '1,234,567.890', negative: '-1,234,567.890', small: '0.120' }, 
    { format: NumberFormat.SPACE_DOT, positive: '1 234 567.89', negative: '-1 234 567.89', small: '0.12' },
    { format: NumberFormat.APOSTROPHE_DOT, positive: "1'234'567.89", negative: "-1'234'567.89", small: '0.12' },
    { format: NumberFormat.DOT_NO_DECIMAL, positive: '1.234.567', negative: '-1.234.567', small: '0' }, // No decimals
    { format: NumberFormat.COMMA_NO_DECIMAL, positive: '1,234,567', negative: '-1,234,567', small: '0' }, // No decimals
    { format: NumberFormat.SPACE_HYPHEN, positive: '1 234 567-89', negative: '-1 234 567-89', small: '0-12' },
    { format: NumberFormat.SPACE_COMMA, positive: '1 234 567,89', negative: '-1 234 567,89', small: '0,12' },
    { format: NumberFormat.COMMA_SLASH, positive: '1,234,567/89', negative: '-1,234,567/89', small: '0/12' },
    { format: NumberFormat.SPACE_NO_DECIMAL, positive: '1 234 567', negative: '-1 234 567', small: '0' }, // No decimals
    // Indian Numbering System
    { format: NumberFormat.COMMA_DOT_LEADING, positive: '12,34,567.89', negative: '-12,34,567.89', small: '0.12' }
  ]

  testCases.forEach(({ format, positive, negative, small }) => {
    it(`should format numbers correctly for ${format}`, () => {
      // Use 1234567.89 for positive/negative, 0.12 for small
      // Adjust input for DOT_COMMA_THREE to have 3 decimals
      const posInput = format === NumberFormat.DOT_COMMA_THREE ? 1234567.890 : 1234567.89;
      const negInput = format === NumberFormat.DOT_COMMA_THREE ? -1234567.890 : -1234567.89;
      const smallInput = format === NumberFormat.DOT_COMMA_THREE ? 0.120 : 0.12;

      expect(formatNumberByFormat(posInput, format)).toBe(positive);
      expect(formatNumberByFormat(negInput, format)).toBe(negative);
      expect(formatNumberByFormat(smallInput, format)).toBe(small);
      // Test zero - Updated regex to allow 3 decimal places for DOT_COMMA_THREE
      expect(formatNumberByFormat(0, format)).toMatch(/^[-]?0([.,\/\-]?(00|000))?$/); // Matches 0, 0.00, 0,00, 0.000 etc.
    })
  })
});

describe('parseFormattedNumberToDecimal', () => {
  // Test cases matching the formatNumberByFormat tests
  const parseTestCases = [
    { format: NumberFormat.DOT_COMMA, positiveStr: '1,234,567.89', negativeStr: '-1,234,567.89', positiveNum: '1234567.89', negativeNum: '-1234567.89' },
    { format: NumberFormat.COMMA_COMMA, positiveStr: '1.234.567,89', negativeStr: '-1.234.567,89', positiveNum: '1234567.89', negativeNum: '-1234567.89' },
    // DOT_COMMA_THREE parsing should still result in 2 decimal places for standard decimal string
    { format: NumberFormat.DOT_COMMA_THREE, positiveStr: '1,234,567.890', negativeStr: '-1,234,567.890', positiveNum: '1234567.89', negativeNum: '-1234567.89' }, 
    // Corrected expected values for SPACE_DOT for the large number input
    { format: NumberFormat.SPACE_DOT, positiveStr: '1 234 567.89', negativeStr: '-1 234 567.89', positiveNum: '1234567.89', negativeNum: '-1234567.89' }, 
    { format: NumberFormat.APOSTROPHE_DOT, positiveStr: "1'234'567.89", negativeStr: "-1'234'567.89", positiveNum: '1234567.89', negativeNum: '-1234567.89' },
    { format: NumberFormat.DOT_NO_DECIMAL, positiveStr: '1.234.567', negativeStr: '-1.234.567', positiveNum: '1234567.00', negativeNum: '-1234567.00' },
    { format: NumberFormat.COMMA_NO_DECIMAL, positiveStr: '1,234,567', negativeStr: '-1,234,567', positiveNum: '1234567.00', negativeNum: '-1234567.00' },
    { format: NumberFormat.SPACE_HYPHEN, positiveStr: '1 234 567-89', negativeStr: '-1 234 567-89', positiveNum: '1234567.89', negativeNum: '-1234567.89' }, // Existing tests use different numbers, keeping them
    { format: NumberFormat.SPACE_COMMA, positiveStr: '1 234 567,89', negativeStr: '-1 234 567,89', positiveNum: '1234567.89', negativeNum: '-1234567.89' },
    { format: NumberFormat.COMMA_SLASH, positiveStr: '1,234,567/89', negativeStr: '-1,234,567/89', positiveNum: '1234567.89', negativeNum: '-1234567.89' },
    { format: NumberFormat.SPACE_NO_DECIMAL, positiveStr: '1 234 567', negativeStr: '-1 234 567', positiveNum: '1234567.00', negativeNum: '-1234567.00' },
    { format: NumberFormat.COMMA_DOT_LEADING, positiveStr: '12,34,567.89', negativeStr: '-12,34,567.89', positiveNum: '1234567.89', negativeNum: '-1234567.89' }
  ];

  parseTestCases.forEach(({ format, positiveStr, negativeStr, positiveNum, negativeNum }) => {
    it(`should parse ${format} format correctly`, () => {
      mockStoreFormat(format);
      expect(parseFormattedNumberToDecimal(positiveStr)).toBe(positiveNum);
      expect(parseFormattedNumberToDecimal(negativeStr)).toBe(negativeNum);
      expect(parseFormattedNumberToDecimal('0')).toBe('0.00'); // Test zero
    });
  });

  // --- Keep existing specific tests for variety if needed, or remove redundancy ---
  it('should parse SPACE_HYPHEN format correctly (specific cases)', () => {
    mockStoreFormat(NumberFormat.SPACE_HYPHEN);
    expect(parseFormattedNumberToDecimal('1 200-32')).toBe('1200.32');
    expect(parseFormattedNumberToDecimal('-1 200-32')).toBe('-1200.32');
    expect(parseFormattedNumberToDecimal('1 234 567-89')).toBe('1234567.89');
  });

  it('should parse COMMA_COMMA format correctly (specific cases)', () => {
    mockStoreFormat(NumberFormat.COMMA_COMMA);
    expect(parseFormattedNumberToDecimal('1.234,56')).toBe('1234.56');
    expect(parseFormattedNumberToDecimal('-1.234,56')).toBe('-1234.56');
    expect(parseFormattedNumberToDecimal('1.234.567,89')).toBe('1234567.89');
  });

  it('should parse SPACE_DOT format correctly (specific cases)', () => {
    mockStoreFormat(NumberFormat.SPACE_DOT);
    expect(parseFormattedNumberToDecimal('1 234.56')).toBe('1234.56');
    expect(parseFormattedNumberToDecimal('-1 234.56')).toBe('-1234.56');
    expect(parseFormattedNumberToDecimal('1 234 567.89')).toBe('1234567.89');
  });
  // --- End of potentially redundant tests ---

  it('should handle missing budget store gracefully', () => {
    // Mock store returning null budget
    vi.mocked(useBudgetStore).mockReturnValue({
      currentBudget: null
    } as ReturnType<typeof useBudgetStore>)

    // Should default to DOT_COMMA parsing logic or direct parseFloat
    expect(parseFormattedNumberToDecimal('1,234.56')).toBe('1234.56'); 
    expect(parseFormattedNumberToDecimal('-1,234.56')).toBe('-1234.56');
    // Test plain number
    expect(parseFormattedNumberToDecimal('1234.56')).toBe('1234.56');
    expect(parseFormattedNumberToDecimal('-1234.56')).toBe('-1234.56');
  });

  it('should handle invalid/empty input gracefully', () => {
    mockStoreFormat(NumberFormat.DOT_COMMA); // Use any format
    expect(parseFormattedNumberToDecimal('')).toBe('0.00');
    expect(parseFormattedNumberToDecimal('abc')).toBe('0.00');
    expect(parseFormattedNumberToDecimal('--123')).toBe('0.00'); // Invalid number
  });
}); 