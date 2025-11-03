/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // add field
  collection.fields.addAt(12, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1543120290",
    "hidden": false,
    "id": "relation2253683053",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "thisIsMultipleRelation",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // remove field
  collection.fields.removeById("relation2253683053")

  return app.save(collection)
})
