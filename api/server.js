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
    balance: 1000000,
    currency: "VND",
    created_at: new Date().toISOString(),
  };
  db.get("accounts").push(account).write();

  const card = {
    id: +(db.get("cards").size().value()) + 1,
    accountId: account.id,
    cardNumber: Math.floor(4000000000000000 + Math.random() * 100000000000000).toString(),
    cardHolderName: fullName.toUpperCase(),
    expiryDate: "12/28",
    cvv: Math.floor(100 + Math.random() * 900).toString(),
    created_at: new Date().toISOString(),
  };
  db.get("cards").push(card).write();

  return res.status(201).json({
    message: "User initialized successfully",
    userId,
    account,
    card,
  });
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
