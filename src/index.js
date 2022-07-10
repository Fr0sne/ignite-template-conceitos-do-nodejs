const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  if (!username)
    return response.send({
      error: "No username provider in headers.",
    });
  const checkExistence = users.filter((user) => {
    return user.username == username;
  });
  if (!checkExistence.length)
    return response.send({
      error: `User '${username}' not found.`,
    });
  request.user = checkExistence.at(0);
  return next();
}

function avoidUserDuplication(request, response, next) {
  const { username } = request.body;
  const existentsUsers = users.filter((user) => {
    return user.username == username;
  });
  if (!existentsUsers.length) return next();
  return response.status(400).send({
    error: "This username has already exists.",
  });
}

app.post("/users", avoidUserDuplication, (request, response) => {
  const { name, username } = request.body;
  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };
  users.push(newUser);
  return response.send(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;

  return response.send(request.user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };
  request.user.todos.push(newTodo);
  return response.status(201).send(newTodo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  let index;
  const todo = request.user.todos.filter((todo, i) => {
    if (todo.id == request.params.id) {
      index = i;
      todo.deadline = deadline;
      todo.title = title;
      return todo;
    }
  });
  if (!todo.length)
    return response.status(404).send({
      error: "No todo found with this id.",
    });
  return response.send(todo.at(0));
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  let index;
  const todo = request.user.todos.filter((todo, i) => {
    if (todo.id == request.params.id) {
      index = i;
      todo.done = true;
      return todo;
    }
  });
  if (!todo.length)
    return response.status(404).send({ error: "No todo found with this id." });
  return response.send(todo.at(0));
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  let index;
  let deleted;
  const target = request.user.todos.filter((todo, i) => {
    if (todo.id == request.params.id) {
      index = i;
      deleted = { ...todo };
      return true;
    }
    if (i == request.user.todos.length - 1 && !index) {
      notFound = true;
    }
  });
  if (!target.length)
    return response.status(404).send({
      // error: true,
      error: "No todo found with this id.",
    });
  request.user.todos.splice(index, 1);
  return response.status(204).send({
    message: "Todo deleted successfully.",
  });
});

module.exports = app;
