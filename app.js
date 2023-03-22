//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', true);
//mongoose.connect(process.env.MONGO_URL)
//connecting to local server hosted database
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb+srv://abhijeet:Test123@cluster0.jhedygn.mongodb.net/todolistDB');
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/todolistDB');` if your database has auth enabled
}

//make the schema for the table or data
const itemsSchema = new mongoose.Schema({
  name: String
});
//make the item model
const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultlist = [item1,item2,item3];

//make a new schema for the lists
const listSchema = new mongoose.Schema({
  name: String,
  items : [itemsSchema]
});
//and model for list shema
const List = mongoose.model('List',listSchema);


//root route
app.get("/", function(req, res) {
  //find everything in our database
  Item.find({},function(err,items){
    if(err){
      console.log(err);
    } else {
      //if there are no items add the default list
      if(items.length === 0){
        Item.insertMany(defaultlist,function(err){
          if(err){
            console.log(err);
          } else {
            console.log("Successfully inserted in the database");
          }
        });
        res.redirect("/");
      }
      else
        res.render("list", {listTitle: "Today", newListItems: items});
      //console.log(items);
    }
  });
  //mongoose.connection.close(); 
});

//route for custom list name
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  //console.log("in work"+customListName);
  List.findOne({name: customListName},function(err,listname){
    if(!err)
    {
      if(listname === null)
      {
        console.log("Doesn't exits");
        const list = new List({
          name: customListName,
          items : defaultlist
        });
        list.save();
        res.redirect("/"+customListName);
      }
      else
        res.render("list",{listTitle: listname.name, newListItems:listname.items});
    }
    else
      console.log(err);
  });
  
});

//post route for root
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item_ = new Item({
    name: itemName
  });
  if(listName === "Today"){
    item_.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName},function(err,foundList){
      if(!err)
      {
        foundList.items.push(item_);
        foundList.save();
        res.redirect("/"+listName);
      }
    });
  }
  
});

//post route for delte 
app.post("/delete",function(req,res){
  const listName = req.body.listName;
  //console.log("I am here in delete");
  //console.log(listName);
  const itemid = req.body.checkbox;
  if(listName === "Today"){
    Item.findByIdAndRemove(itemid,function(err){
      if(err)
        console.log(err);
      else
        console.log("Successfully deleted");
    });
    res.redirect("/");
  }
  else{
      List.findOneAndUpdate({name: listName},{$pull:{items:{_id:itemid}}},function(err,foundList){
      if(!err)
      {
        res.redirect("/"+listName);
      }
    });
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
