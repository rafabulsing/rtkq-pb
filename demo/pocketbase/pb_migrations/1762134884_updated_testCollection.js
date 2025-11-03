/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "file1920702599",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "thisIsFile",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [
      "50x50"
    ],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // update field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "file1920702599",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "thisIsFile",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})
