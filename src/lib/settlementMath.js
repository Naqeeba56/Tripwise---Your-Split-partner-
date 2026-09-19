/**
 * Calculates net balances for all members in a trip.
 * Supports member exclusions per expense and sub-member dependent consolidation.
 * 
 * @param {Array} members - Array of member objects [{ name, avatar, upi_id, parentMemberName }]
 * @param {Array} expenses - Array of expense items [{ amount, paidBy, excludedMembers }]
 * @returns {Object} { totalSpent, perPersonShare, netBalances }
 */
export const calculateNetBalances = (members = [], expenses = []) => {
  const memberObjs = members.map((m) => (typeof m === 'string' ? { name: m } : m));
  const memberNames = memberObjs.map((m) => m.name);
  const memberCount = memberNames.length;

  const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const perPersonShare = memberCount > 0 ? totalSpent / memberCount : 0;

  const netBalances = {};
  memberNames.forEach((name) => {
    netBalances[name] = 0;
  });

  // Calculate balances per expense taking into account excluded members
  expenses.forEach((exp) => {
    const amt = Number(exp.amount || 0);
    const payer = exp.paidBy || exp.payer || 'Unknown';
    const excluded = Array.isArray(exp.excludedMembers) ? exp.excludedMembers : [];

    const included = memberNames.filter((name) => !excluded.includes(name));
    const activeCount = included.length > 0 ? included.length : memberCount;
    const sharePerIncluded = activeCount > 0 ? amt / activeCount : 0;

    // Debit share from each included member
    included.forEach((name) => {
      if (netBalances[name] !== undefined) {
        netBalances[name] -= sharePerIncluded;
      } else {
        netBalances[name] = -sharePerIncluded;
      }
    });

    // "Paid by multiple" — each payer is credited their individual amount.
    // Backward compatible: no payers array → single payer gets the full amount.
    if (Array.isArray(exp.payers) && exp.payers.length > 0) {
      exp.payers.forEach((p) => {
        const amountPaid = Number(p.amount || 0);
        if (amountPaid <= 0) return;
        if (netBalances[p.name] !== undefined) {
          netBalances[p.name] += amountPaid;
        } else {
          netBalances[p.name] = amountPaid;
        }
      });
    } else if (netBalances[payer] !== undefined) {
      netBalances[payer] += amt;
    } else {
      netBalances[payer] = amt;
    }
  });

  // Consolidate sub-member / dependent balances into their parent members
  memberObjs.forEach((mObj) => {
    const parentName = mObj.parentMemberName || mObj.parent_member_name;
    if (parentName && parentName !== mObj.name && netBalances[parentName] !== undefined) {
      const childBalance = netBalances[mObj.name] || 0;
      netBalances[parentName] += childBalance;
      netBalances[mObj.name] = 0; // Sub-member settled via parent
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

