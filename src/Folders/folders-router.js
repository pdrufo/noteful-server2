const express = require('express');
const logger = require('../logger');
const xss = require('xss');

const FoldersService = require('./folders-service');

const bodyParser = express.json();
const foldersRouter = express.Router();

const serializeFolder = folder => ({
  id: folder.id,
  title: xss(folder.title)
});

foldersRouter
  .route('/api/folders')
  .get((req, res, next) => {
    FoldersService.getAllFolders(req.app.get('db'))
      .then(folders => {
        res.json(folders.map(serializeFolder));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title } = req.body;

    if (!title) {
      logger.error('Title is required');
    }

    const newFolder = { title };

    FoldersService.insertFolder(req.app.get('db'), newFolder)
      .then(folder => {
        logger.info(`Folder with id ${folder.id} has been created.`);
        res.status(201)
          .location(`/api/folders/${folder.id}`)
          .json(serializeFolder(folder));
      })
      .catch(next);
  });

foldersRouter
  .route('/api/folders/:id')
  .all((req, res, next) => {
    const { id } = req.params;
    FoldersService.getById(req.app.get('db'), id)
      .then(folder => {
        if (!folder) {
          logger.error(`Folder with id ${id} not found`);
          return res
            .status(404)
            .send('Folder not found');
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(serializeFolder(res.folder)); //!! Bookmarks api had no res. in front
  })
  .delete((req, res, next) => {
    const { id } = req.params;
    FoldersService.deleteFolder(req.app.get('db'), id)
      .then(rowsAffected => {
        if (rowsAffected < 1) {
          logger.info(`Folder with id ${id} not found`);
          res.status(404).send('Folder not found');
        }
        logger.info(`Folder with id ${id} deleted`);
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const { title } = req.body;
    const folderToUpdate = { title };

    FoldersService.updateFolder(req.app.get('db'), req.params.folder_id, folderToUpdate)
      .then(numFieldsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = foldersRouter;