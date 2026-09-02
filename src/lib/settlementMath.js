/**
 * Calculates net balances for all members in a trip.
 * 
 * @param {Array} members - Array of member objects [{ name, avatar, upi_id }]
 * @param {Array} expenses - Array of expense items [{ amount, paidBy, ... }]
 * @returns {Object} { totalSpent, perPersonShare, netBalances }
 */
export const calculateNetBalances = (members = [], expenses = []) => {
  const memberList = members.map((m) => (typeof m === 'string' ? m : m.name));
  const memberCount = memberList.length;

  const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const perPersonShare = memberCount > 0 ? totalSpent / memberCount : 0;

  const netBalances = {};
  memberList.forEach((name) => {
    netBalances[name] = -perPersonShare;
  });

  expenses.forEach((exp) => {
    const payer = exp.paidBy || exp.payer || 'Unknown';
    if (netBalances[payer] !== undefined) {
      netBalances[payer] += Number(exp.amount || 0);
    } else {
      netBalances[payer] = Number(exp.amount || 0) - perPersonShare;
    }
  });

  return { totalSpent, perPersonShare, netBalances };
};

/**
 * Calculates optimal minimal transactions between debtors and creditors.
 * 
 * @param {Object} netBalances - Object mapping memberName to net balance
 * @returns {Array} Array of settlement objects [{ id, from, to, amount }]
 */
export const calculateOptimalSettlements = (netBalances = {}) => {
  const debtors = [];
  const creditors = [];

  Object.entries(netBalances).forEach(([person, balance]) => {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded < -0.5) {
      debtors.push({ person, amount: Math.abs(rounded) });
    } else if (rounded > 0.5) {
      creditors.push({ person, amount: rounded });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const payment = Math.min(debtor.amount, creditor.amount);

    if (payment > 0) {
      settlements.push({
        id: `${debtor.person}-${creditor.person}-${Math.round(payment)}`,
        from: debtor.person,
        to: creditor.person,
        amount: Math.round(payment),
      });
    }

    debtor.amount = Math.round((debtor.amount - payment) * 100) / 100;
    creditor.amount = Math.round((creditor.amount - payment) * 100) / 100;

    if (debtor.amount <= 0.01) i++;
    if (creditor.amount <= 0.01) j++;
  }

  return settlements;
};
