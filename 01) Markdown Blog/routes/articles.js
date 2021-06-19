const express = require('express');
const Article = require('../models/article');
const router = express.Router();

router.get('/new', (req, res) => {
  res.render('articles/new', { article: new Article() });
});

router.get('/edit/:id', async (req, res) => {
  const article = await Article.findById(req.params.id);
  res.render('articles/edit', { article });
});

router.get('/:slug', async (req, res) => {
  // find the article
  const article = await Article.findOne({ slug: req.params.slug });
  // check if article exists
  if (article == null) {
    return res.redirect('/');
  }
  // show the article
  res.render('articles/show', { article });
});

// function
const saveArticleAndRedirect = (path) => {
  return async (req, res) => {
    // create a new article using mongoose model
    let article = req.article;
    article.title = req.body.title;
    article.description = req.body.description;
    article.markdown = req.body.markdown;

    // save the article to db
    try {
      article = await article.save();
      res.redirect(`/articles/${article.slug}`);
    } catch (error) {
      res.render(`articles/${path}`, { article });
    }
  };
};

router.post(
  '/',
  async (req, res, next) => {
    req.article = new Article();
    next();
  },
  saveArticleAndRedirect('new')
);

router.put(
  '/:id',
  async (req, res, next) => {
    req.article = await Article.findById(req.params.id);
    next();
  },
  saveArticleAndRedirect('edit')
);

router.delete('/:id', async (req, res) => {
  await Article.findByIdAndDelete(req.params.id);
  res.redirect('/');
});

module.exports = router;
