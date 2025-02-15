const transactionManager = {
  initialBalance: 5000.0, // Mock initial balance
  transactionHistory: [],

  getBalance: function () {
    return this.initialBalance;
  },

  buy: function (amount) {
    if (amount > this.initialBalance) {
      throw new Error("Insufficient balance.");
    }
    this.initialBalance -= amount;
    this.addTransaction("BUY", amount);
  },

  sell: function (amount) {
    this.initialBalance += amount;
    this.addTransaction("SELL", amount);
  },

  addTransaction: function (action, amount) {
    this.transactionHistory.push({
      id: this.transactionHistory.length + 1,
      action,
      amount,
      date: new Date().toLocaleString(),
    });
  },

  getTransactionHistory: function () {
    return this.transactionHistory;
  },
};

export default transactionManager;
