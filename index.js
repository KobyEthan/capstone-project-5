import express from "express";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";

const app = express();
const port = 3000;

// Establish database connection
const db = new sqlite3.Database("./data/database.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) console.error(err.message);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Function to fetch items for the current list
async function getItems(currentListId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM items WHERE list_id = ?`;
    db.all(sql, [currentListId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Function to fetch a list by its ID
async function getListById(listId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM lists WHERE id = ?`;
    db.get(sql, [listId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

async function getAllLists(){
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM lists`;
      db.all(sql, [], (err, row) =>{
      if (err){
        reject(err);
      }else{
        resolve(row);
      }
      return row;
    });
  });
}


getAllLists();

app.get("/", async (req, res) => {
  try {
    const currentListId = 1;
    const items = await getItems(currentListId);
    const currentList = await getListById(currentListId);
    const lists = await getAllLists();

    res.render("index.ejs", {
      listItems: items,
      currentList: currentList,
      lists: lists,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/new", (req, res) => {
  res.render("new.ejs");
});

app.get("/get-list", async (req, res) => {
  try {
    const listId = req.query.list;
    const currentList = await getListById(listId);
    const items = await getItems(listId);

    res.render("index.ejs", {
      listItems: items,
      currentList: currentList,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/new-list", (req, res) => {
  const newListName = req.body.newListName;
  const sql = `INSERT INTO lists (name) VALUES (?)`;
  db.run(sql, [newListName], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.redirect("/");
  });
});

app.post("/add", (req, res) => {
  const item = req.body.newItem;
  const listId = req.body.listId; // Assuming you have a hidden field in your form for listId
  const sql = `INSERT INTO items (content, list_id) VALUES (?, ?)`;
  db.run(sql, [item, listId], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.redirect("/");
  });
});

app.post("/edit", (req, res) => {
  const item = req.body.updatedItemContent;
  const id = req.body.updatedItemId;
  sql = `UPDATE items SET content = ? WHERE id = ?`;
    db.run(sql, [item, id], (err) => {
   if (err) {return console.error(err.message)};
   res.redirect("/");
 });
});

app.post("/delete", (req, res) => {
  const id = req.body.deletedItemId;
  sql = `DELETE FROM items WHERE id = ?`;
    db.run(sql, [id], (err) => {
      if (err) {return console.error(err.message)};
      res.redirect("/");
    });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
