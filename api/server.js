// See https://github.com/typicode/json-server#module
const jsonServer = require("json-server");
const auth = require("json-server-auth");

const app = jsonServer.create();
const router = jsonServer.router("db.json");

app.db = router.db;

const middlewares = jsonServer.defaults();
app.use("/", middlewares);

app.use(auth);
app.use(router);

app.listen(8080, () => {
  console.log("JSON Server is running");
});

// Export the Server API
module.exports = app;
