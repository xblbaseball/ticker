export function toRoman(value: number) {
    if (isNaN(value)) {
      return '';
    }
  
    const romanNumerals = [
      { value: 1000, numeral: 'M' },
      { value: 900, numeral: 'CM' },
      { value: 500, numeral: 'D' },
      { value: 400, numeral: 'CD' },
      { value: 100, numeral: 'C' },
      { value: 90, numeral: 'XC' },
      { value: 50, numeral: 'L' },
      { value: 40, numeral: 'XL' },
      { value: 10, numeral: 'X' },
      { value: 9, numeral: 'IX' },
      { value: 5, numeral: 'V' },
      { value: 4, numeral: 'IV' },
      { value: 1, numeral: 'I' }
    ];
  
    let romanNumeral = '';
  
    for (let i = 0; i < romanNumerals.length; i++) {
      while (value >= romanNumerals[i].value) {
        romanNumeral += romanNumerals[i].numeral;
        value -= romanNumerals[i].value;
      }
    }
  
    return romanNumeral;
  }