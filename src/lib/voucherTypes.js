export const VOUCHER_TYPES = {
  1281: { id: 1281, code: 'MRP', name: 'Material Receipt To Expense' },
  771: { id: 771, code: 'DEV', name: 'Direct Expense Voucher' },
  2570: { id: 2570, code: 'CEB', name: 'Cash Expense Booking' },
  768: { id: 768, code: 'PUV', name: 'Purchases Vouchers' },
  2560: { id: 2560, code: 'LPO', name: 'Local Purchases Orders' },
};

export const VOUCHER_TYPE_OPTIONS = Object.values(VOUCHER_TYPES);

export function getVoucherType(type) {
  const id = Number(type);
  return VOUCHER_TYPES[id] || { id, code: 'VCH', name: `Voucher Type ${id}` };
}

export function getVoucherTypeLabel(type) {
  const voucherType = getVoucherType(type);
  return `${voucherType.code} - ${voucherType.name}`;
}
