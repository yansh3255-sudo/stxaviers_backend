import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("St. Xaviers ERP Backend Running Successfully!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

