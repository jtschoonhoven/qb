var models = {

	user: {
		name: "user",
		table: "users",
		alias: "u",
		key: "id",
		columns: [
			{ name: "id" },
			{ name: "join_date", property: "TO_CHAR(u.created_at, 'YYYY-MM-DD')" },
		]
	},

	petition: {
		name: "petition",
		table: "events",
		alias: "e",
		key: "id",
		properties: {

		}
	},

	signature: {
		name: "signature",
		table: "signatures_users",
		alias: "s",
		key: "id",
		properties: {

		}
	},

	tag: {
		name: "tag",
		table: "tags",
		alias: "t",
		key: "id",
		properties: {

		}
	},

};

var associations = {

	user: {
		tag: [{ join: "signature" }, { join: "tag" }]
	}

};


var user = sql.define({
  name: "user",
  columns: [{
      name: "id"
    }, {
      name: "state_or_province",
      property: "state"
    }
  ]
});