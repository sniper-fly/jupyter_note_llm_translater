import { describe, it, expect } from 'vitest';
import { processTranslatedText } from './main';

describe('processTranslatedText', () => {
  it('should process normal markdown text correctly', () => {
    const input = "Line 1\nLine 2\nLine 3";
    const result = processTranslatedText(input, "markdown");
    expect(result).toEqual(["Line 1\n", "Line 2\n", "Line 3"]);
  });

  it('should process code with markdown fence correctly', () => {
    const input = "```python\nprint('hello')\n# Comment\n```";
    const result = processTranslatedText(input, "code");
    expect(result).toEqual(["print('hello')\n", "# Comment\n"]);
  });

  it('should handle code without markdown fence', () => {
    const input = "print('hello')\n# Comment";
    const result = processTranslatedText(input, "code");
    expect(result).toEqual(["print('hello')\n", "# Comment"]);
  });

  it('should handle empty input', () => {
    const result = processTranslatedText("", "markdown");
    expect(result).toEqual([]);
  });
});
