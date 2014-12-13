module.exports = {

	user: {
		alias: "user",
		name: "users",
		columns: [
			"id",
			{ property: "Join date", name: "created_at" }
		],
		join: {
			petition: { target_key: "user_id", type: "oneToMany" },
			signature: { target_key: "user_id", type: "oneToMany" }
		}
	},

	petition: {
		alias: "petition",
		name: "events",
		columns: [
			"id",
			{ property: "Start date", name: "created_at" }
		],
		join: {
			user: { source_key: "user_id", type: "oneToOne" },
			signature: { target_key: "petition_id", type: "oneToMany" },
			tag: { via: "taggings" }
		}
	},

	signature: {
		alias: "signature",
		name: "signatures_users",
		columns: [
			"id",
			{ property: "Sign date", name: "created_at" }
		],
		join: {
			user: { source_key: "user_id", type: "manyToOne" },
			petition: { source_key: "petition_id", type: "manyToOne" },
			tag: { source_key: "petition_id", via: "taggings" }
		}
	},

	tag: {
		alias: "tag",
		name: "tags",
		columns: [ "id", "name" ],
		join: { 
			taggings: { target_key: "tag_id", type: "oneToOne" }
		}
	},

	taggings: {
		alias: "taggings",
		name: "taggings",
		columns: [ "id", "tag_id", "taggable_id" ],
		join: {
			petition: { source_key: "taggable_id", type: "manyToOne" },
			signature: { source_key: "taggable_id", type: "manyToOne" },
			tag: { source_key: "tag_id", type: "oneToOne" }
		}
	}

};