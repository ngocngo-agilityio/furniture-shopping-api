// See https://github.com/typicode/json-server#module
const jsonServer = require("json-server");
const auth = require("json-server-auth");
const { v4: uuidv4 } = require("uuid");

const app = jsonServer.create();
const router = jsonServer.router("db.json");

app.db = router.db;
app.use(jsonServer.bodyParser);
const rules = auth.rewriter({
  // Permission rules
  //users: 660,
  cart_items: 660,
});

// You must apply the middlewares in the following order
app.use(rules);

app.post("/init-account", (req, res) => {
  const { fullName, userId } = req.body;
  const db = router.db;

  const account = {
    id: +(db.get("accounts").size().value()) + 1,
    userId: userId,
    accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
    balance: 1000,
    currency: "USD",
    created_at: new Date().toISOString(),
  };
  db.get("accounts").push(account).write();

  const card = {
    id: +(db.get("cards").size().value()) + 1,
    accountId: account.id,
    cardNumber: Math.floor(4000000000000000 + Math.random() * 100000000000000).toString(),
    cardHolderName: fullName.toUpperCase(),
    expiredDate: "12/2028",
    cardCvv: Math.floor(100 + Math.random() * 900).toString(),
    created_at: new Date().toISOString(),
    cardType: "Mastercard",
    cardLogo: "https://firebasestorage.googleapis.com/v0/b/ecommerce-fashion-16e2e.appspot.com/o/bankpick%2Fmastercard-logo.svg?alt=media&token=77966e12-2b8f-43d0-98cf-4b787efe7d64"
  };
  db.get("cards").push(card).write();

  return res.status(201).json({
    message: "User initialized successfully",
    userId,
    account,
    card,
  });
});

app.get("/accounts/:id/transactions", (req, res) => {
  const db = router.db;
  const accountId = Number(req.params.id);
  const { page = 1, limit = 10, fullName } = req.query;
  const users = db.get("users").value();
  const accounts = db.get("accounts").value();
  const userAccount = accounts.find(a => a.userId === accountId);
  console.log('userAccount', userAccount);
  const transactions = db
    .get("transactions")
    .filter(t => t.fromAccountId === accountId || t.toAccountId === accountId )
    .value();
  console.log('transactions', transactions);
  const enhancedTransactions = transactions.map(t => {
    const relatedAccount = t.fromAccountId != accountId ? accounts.find(a => a.id === t.fromAccountId) : accounts.find(a => a.id === t.toAccountId);
    const relatedUser = users.find(u => u.id === relatedAccount.userId);
    return {
      ...t,
      relatedUser,
      amount: t.fromAccountId != accountId ? t.amount : -t.amount,
    };
  });

  // Filter by related user's fullName if provided
  let filtered = enhancedTransactions;
  if (fullName) {
    const search = String(fullName).toLowerCase();
    filtered = enhancedTransactions.filter(item => {
      const name = item.relatedUser && item.relatedUser.fullName
        ? String(item.relatedUser.fullName).toLowerCase()
        : "";
      return name.includes(search);
    });
  }

  // Pagination
  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return res.status(200).json({
    transactions: paginated,
    totalPages: Math.ceil(filtered.length / pageSize),
    page: pageNumber,
    limit: pageSize,
  }
  );
});


app.get("/accounts/:id/recipients", (req, res) => {
  const db = router.db;
  const accountId = Number(req.params.id);
  const { page = 1, limit = 10, name } = req.query;
  const users = db.get("users").value();
  const accounts = db.get("accounts").value();
  const userAccount = accounts.find(a => a.userId === accountId);
  console.log('userAccount', userAccount);
  const recipients = db
    .get("recipients")
    .filter(t => t.accountId === accountId)
    .value();
  console.log('recipients', recipients);
  const enhancedRecipients= recipients.map(t => {
    const accountInfo = accounts.find(a => a.id === t.recipientId);
    const relatedUser = users.find(u => u.id === accountInfo.userId);
    return {
      ...t,
      recipientUser: relatedUser,
    };
  });

  // Filter by related user's fullName if provided
  let filtered = enhancedRecipients;
  if (name) {
    const search = String(name).toLowerCase();
    filtered = enhancedRecipients.filter(item => {
      const nickname = item.nickname.toLowerCase();
      return nickname.includes(search) || item?.relatedUser?.fullName.toLowerCase().includes(search);
    });
  }

  // Pagination
  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  return res.status(200).json({
    recipients: paginated,
    totalPages: Math.ceil(filtered.length / pageSize),
    page: pageNumber,
    limit: pageSize,
  }
  );
});

app.get("/find-account", (req, res) => {
  const db = router.db;
  const { cardNumber } = req.query;
  const card = db.get("cards").find({ cardNumber: cardNumber }).value();
  const account = card ? db.get("accounts").find({ id: card.accountId }).value() : null;
  const user = account ? db.get("users").find({ id: account.userId }).value() : null;
  return res.status(200).json({
    account,
    cardNumber,
    user
  });
});

app.post("/make-transaction", (req, res) => {
  const db = router.db;
  const { fromAccountId, toAccountId, amount } = req.body;
  const fromAccount = db.get("accounts").find({ id: fromAccountId }).value();
  const toAccount = db.get("accounts").find({ id: toAccountId }).value();
  if (fromAccount.balance < amount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }
  db.get("accounts").find({ id: fromAccountId }).assign({ balance: fromAccount.balance - amount }).write();
  db.get("accounts").find({ id: toAccountId }).assign({ balance: toAccount.balance + amount }).write();
  return res.status(200).json({ message: "Transaction successful" });
});

const middlewares = jsonServer.defaults();
app.use("/", middlewares);

app.use(auth);

// Get current logged-in user info
app.get("/me/:id", (req, res) => {
  const db = router.db;
  const userId = Number(req.params.id);
  const user = db.get("users").find({ id: userId }).value();
  const account = db.get("accounts").find({ userId: userId }).value();
  const card = db.get("cards").find({ accountId: account.id }).value();
  return res.status(200).json({
    user,
    account,
    card,
  });
});

app.use(router);


app.listen(8080, () => {
  console.log("JSON Server is running");
});

// Export the Server API
module.exports = app;
