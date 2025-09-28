// Height conversion utilities

// Convert cm to feet and inches
export const cmToFeetInches = (cmValue: number) => {
  const totalInches = cmValue / 2.54
  const feetValue = Math.floor(totalInches / 12)
  const inchesValue = Math.round(totalInches % 12)
  // Handle case where inches round to 12
  if (inchesValue === 12) {
    return { feet: feetValue + 1, inches: 0 }
  }
  return { feet: feetValue, inches: inchesValue }
}

// Convert feet and inches to cm
export const feetInchesToCm = (feetValue: number, inchesValue: number) => {
  const totalInches = (feetValue * 12) + inchesValue
  return Math.round(totalInches * 2.54)
}

// Format cm as feet'inches" string for display
export const formatHeightDisplay = (cm: string | number): string => {
  const heightCm = typeof cm === 'string' ? parseFloat(cm) : cm
  
  if (!heightCm || heightCm <= 0) {
    return 'Not set'
  }
  
  const { feet, inches } = cmToFeetInches(heightCm)
  return `${feet}'${inches}"`
}