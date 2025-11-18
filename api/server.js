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
    cvv: Math.floor(100 + Math.random() * 900).toString(),
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
  const users = db.get("users").value();
  const accounts = db.get("accounts").value();
  const userAccount = accounts.find(a => a.userId === accountId);
  console.log('userAccount', userAccount);
  const transactions = db
    .get("transactions")
    .filter(t => t.fromAccountId === accountId || t.toAccountId === accountId )
    .value();
  console.log('transactions', transactions);
  const response = transactions.map(t => {
    const relatedAccount = t.fromAccountId != accountId ? accounts.find(a => a.id === t.fromAccountId) : accounts.find(a => a.id === t.toAccountId);
    const relatedUser = users.find(u => u.id === relatedAccount.userId);
    return {
      ...t,
      relatedUser,
      amount: t.fromAccountId != accountId ? t.amount : -t.amount,
    };
  });
  return res.status(200).json(response);
});

const middlewares = jsonServer.defaults();
app.use("/", middlewares);

app.use(auth);
app.use(router);


app.listen(8080, () => {
  console.log("JSON Server is running");
});

// Export the Server API
module.exports = app;
