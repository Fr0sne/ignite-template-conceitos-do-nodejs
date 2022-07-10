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
  const user = users.find((user) => {
    return user.username == username;
  });
  if (!user)
    return response.send({
      error: `User '${username}' not found.`,
    });
  request.user = user;
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
  const userTarget = users.find((user) => user.username == username);
  return response.send(userTarget.todos);
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
  const userTarget = users.find(
    (user) => user.username == request.headers.username
  );

  userTarget.todos.push(newTodo);
  return response.status(201).send(newTodo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const userTarget = users.find(
    (user) => user.username == request.headers.username
  );

  const todo = userTarget.todos.find((todo) => todo.id == request.params.id);
  if (!todo)
    return response.status(404).send({
      error: "No todo found with this id.",
    });
  todo.title = title;
  todo.deadline = deadline;
  return response.send(todo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const userTarget = users.find(
    (user) => user.username == request.headers.username
  );

  const todo = userTarget.todos.find((todo) => todo.id == request.params.id);
  if (!todo)
    return response.status(404).send({ error: "No todo found with this id." });
  todo.done = true;
  return response.send(todo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const userTarget = users.find(
    (user) => user.username == request.headers.username
  );

  const todo = userTarget.todos.find((todo) => {
    return todo.id == request.params.id;
  });
  if (!todo)
    return response.status(404).send({
      error: "No todo found with this id.",
    });
  userTarget.todos = userTarget.todos.filter((todo) => {
    return todo.id != request.params.id;
  });
  return response.status(204).send({
    message: "Todo deleted successfully.",
  });
});

module.exports = app;
