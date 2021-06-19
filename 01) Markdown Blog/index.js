const express = require('express');
const mongoose = require('mongoose');
const Article = require('./models/article');
const articleRouter = require('./routes/articles');
const methodOverride = require('method-override');
const app = express();

mongoose.connect('mongodb://localhost/markdown-blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// specify views
app.set('view engine', 'ejs');

// allows us to access the form data using `req.body.title` in the article router file
app.use(express.urlencoded({ extended: false }));

// allow library to override form methods
app.use(methodOverride('_method'));

app.get('/', async (req, res) => {
  // get all articles and sort them
  const articles = await Article.find().sort({ createdAt: 'desc' });
  // render index.ejs with the data passed
  res.render('articles/index', { articles });
});

// every route in article will have `/articles` at the start
app.use('/articles', articleRouter);

app.listen(3000, () => console.log('Server is running on port 3000'));
