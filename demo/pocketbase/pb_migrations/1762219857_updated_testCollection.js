/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "file1812503545",
    "maxSelect": 99,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "thisIsMultipleFile",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // remove field
  collection.fields.removeById("file1812503545")

  return app.save(collection)
})
