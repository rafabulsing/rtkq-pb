/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // remove field
  collection.fields.removeById("geoPoint923754517")

  // remove field
  collection.fields.removeById("autodate3175243278")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3849143548",
    "max": 0,
    "min": 0,
    "name": "thisIsPlainText",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "convertURLs": false,
    "hidden": false,
    "id": "editor2613089963",
    "maxSize": 0,
    "name": "thisIsRichText",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "editor"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number2583589762",
    "max": null,
    "min": null,
    "name": "thisIsNumber",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "bool3845820901",
    "name": "thisIsBoolean",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
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

  // add field
  collection.fields.addAt(6, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "url3301155894",
    "name": "thisIsUrl",
    "onlyDomains": null,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "url"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "date2695309680",
    "max": "",
    "min": "",
    "name": "thisIsDateTime",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select1151108630",
    "maxSelect": 1,
    "name": "thisIsSelect",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "somebody",
      "once",
      "told",
      "me"
    ]
  }))

  // add field
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

  // add field
  collection.fields.addAt(11, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation4058974157",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "thisIsRelation",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "json2514717650",
    "maxSize": 0,
    "name": "thisIsJson",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "geoPoint3154166719",
    "name": "thisIsGeoPoint",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "geoPoint"
  }))

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "autodate2261412156",
    "name": "thisIsAutoDate",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "geoPoint923754517",
    "name": "testGeo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "geoPoint"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "autodate3175243278",
    "name": "updatedAt",
    "onCreate": true,
    "onUpdate": true,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // remove field
  collection.fields.removeById("text3849143548")

  // remove field
  collection.fields.removeById("editor2613089963")

  // remove field
  collection.fields.removeById("number2583589762")

  // remove field
  collection.fields.removeById("bool3845820901")

  // remove field
  collection.fields.removeById("email2298977853")

  // remove field
  collection.fields.removeById("url3301155894")

  // remove field
  collection.fields.removeById("date2695309680")

  // remove field
  collection.fields.removeById("select1151108630")

  // remove field
  collection.fields.removeById("file1920702599")

  // remove field
  collection.fields.removeById("relation4058974157")

  // remove field
  collection.fields.removeById("json2514717650")

  // remove field
  collection.fields.removeById("geoPoint3154166719")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "autodate2261412156",
    "name": "createdAt",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  return app.save(collection)
})
