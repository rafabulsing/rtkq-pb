/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // update field
  collection.fields.addAt(5, new Field({
    "exceptDomains": [
      "yahoo.com"
    ],
    "hidden": false,
    "id": "email2298977853",
    "name": "thisIsEmail",
    "onlyDomains": null,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "email"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // update field
  collection.fields.addAt(5, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "email2298977853",
    "name": "thisIsEmail",
    "onlyDomains": null,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "email"
  }))

  return app.save(collection)
})
