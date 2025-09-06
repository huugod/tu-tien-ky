const getGuildNextLevelExp = (currentLevel) => {
    // Starts at 1,000,000 for level 1->2, and increases by 50% each level
    return Math.floor(500000 * Math.pow(1.5, currentLevel));
};

/**
 * Formats a large number into a readable string with locale-specific separators.
 * This is a simplified version for server-side logging/error messages.
 * @param num The number to format.
 * @returns A formatted string.
 */
const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Math.floor(num).toLocaleString('vi-VN');
};

module.exports = {
    getGuildNextLevelExp,
    formatNumber
};