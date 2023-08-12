const express = require("express");
const app = express();
const PORT = process.env.PORT || 8000;

//listen
app.listen(PORT, () => {
  console.log("App is listening at Port " + PORT);
});

//routes
app.get("/get-chats", (req, res) => {
  res.status(200).send({
    id: 1,
    content: "I am the content",
  });
});
