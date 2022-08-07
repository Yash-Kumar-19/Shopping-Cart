//============================[Requirements]========================
const express = require("express");
const bodyParser = require("body-parser");
const route = require("./routes/route.js");
const mongoose = require("mongoose");
const multer = require("multer");
const app = express();

app.use(bodyParser.json());
app.use(multer().any())

// =============================[ Connect DataBase ]=========================
mongoose
  .connect(
    "mongodb+srv://sarhank44:sarhank8299@sarhancluster.fxjt3wn.mongodb.net/gorup6Database",
    {
      useNewUrlParser: true,
    }
  )
  .then(() => console.log("database is connected"))
  .catch((err) => console.log(err.message));

app.use("/", route);


app.listen(process.env.PORT || 3000, function () {
  console.log("Express app is running on port" + (process.env.PORT || 3000));
});
