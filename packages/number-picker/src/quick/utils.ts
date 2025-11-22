export const countDecimals = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  const valueString = value.toString();
  if (valueString.includes('e-')) {
    const [base, exponent] = valueString.split('e-');
    const baseDecimals = base.includes('.') ? base.split('.')[1].length : 0;
    return parseInt(exponent, 10) + baseDecimals;
  }
  const decimals = valueString.split('.')[1];
  return decimals ? decimals.length : 0;
};

const trimTrailingZeros = (value: string) => {
  if (!value.includes('.')) {
    return value;
  }

  const trimmed = value.replace(/(\.\d*?[1-9])0+$/u, '$1').replace(/\.0+$/u, '');

  return trimmed === '-0' ? '0' : trimmed;
};

export const createFormatter =
  (decimalPlaces: number) =>
  (val: number): string => {
    if (!Number.isFinite(val)) {
      return '';
    }

    if (decimalPlaces <= 0) {
      return Math.round(val).toString();
    }

    const fixed = val.toFixed(decimalPlaces);
    return trimTrailingZeros(fixed);
  };
