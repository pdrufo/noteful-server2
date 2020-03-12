const express = require('express');
const logger = require('../logger');
const xss = require('xss');

const notesService = require('./notes-service');

const bodyParser = express.json();
const notesRouter = express.Router();

const serializeNote = note => ({
  id: note.id,
  title: xss(note.title),
  content: xss(note.content),
  date_created: note.date_created,
  folder_id: note.folder_id
});

notesRouter
  .route('/api/notes')
  .get((req, res, next) => {
    notesService.getAllNotes(req.app.get('db'))
      .then(notes => {
        res.json(notes.map(serializeNote));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title, content, folder_id } = req.body;

    if (!title || !content || !folder_id) {
      logger.error('Title, content, and folder_id are required');
    }

    const newNote = { title, content, folder_id };

    notesService.insertNote(req.app.get('db'), newNote)
      .then(note => {
        logger.info(`note with id ${note.id} has been created.`);
        res.status(201)
          .location(`/api/notes/${note.id}`)
          .json(serializeNote(note));
      })
      .catch(next);
  });

notesRouter
  .route('/api/notes/:id')
  .all((req, res, next) => {
    const { id } = req.params;
    notesService.getById(req.app.get('db'), id)
      .then(note => {
        if (!note) {
          logger.error(`note with id ${id} not found`);
          return res
            .status(404)
            .send('note not found');
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(serializeNote(res.note)); //!! Bookmarks api had no res. in front
  })
  .delete((req, res, next) => {
    const { id } = req.params;
    notesService.deleteNote(req.app.get('db'), id)
      .then(rowsAffected => {
        if (rowsAffected < 1) {
          logger.info(`note with id ${id} not found`);
          res.status(404).send('note not found');
        }
        logger.info(`note with id ${id} deleted`);
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    const { title } = req.body;
    const noteToUpdate = { title };

    notesService.updateNote(req.app.get('db'), req.params.note_id, noteToUpdate)
      .then(numFieldsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;