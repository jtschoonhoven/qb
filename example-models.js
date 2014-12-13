module.exports = {

	user: {
		alias: "user",
		table: "users",
		columns: [
			{ name: "Join date", property: "TO_CHAR(user.created_at, 'YYYY-MM-DD')" }
		],
		join: {
			petition: { target_key: "user_id", type: "oneToMany" },
			signature: { target_key: "user_id", type: "oneToMany" }
		}
	},

	petition: {
		alias: "petition",
		table: "events",
		columns: [
			{ name: "Start date", property: "TO_CHAR(events.created_at, 'YYYY-MM-DD')" }
		],
		join: {
			user: { source_key: "user_id", type: "oneToOne" },
			signature: { target_key: "petition_id", type: "oneToMany" },
			tag: { via: "taggings" }
		}
	},

	signature: {
		alias: "signature",
		table: "signatures_users",
		columns: [
			{ name: "Sign date", property: "TO_CHAR(signatures_users.created_at, 'YYYY-MM-DD')" }
		],
		join: {
			user: { source_key: "user_id", type: "manyToOne" },
			petition: { source_key: "petition_id", type: "manyToOne" },
			tag: { source_key: "petition_id", via: "taggings" }
		}
	},

	tag: {
		alias: "tag",
		table: "tags",
		columns: [ "name" ],
		join: { 
			taggings: { target_key: "tag_id", type: "oneToOne" }
		}
	},

	taggings: {
		alias: "taggings",
		table: "taggings",
		columns: [ "tag_id", "taggable_id" ],
		join: {
			petition: { source_key: "taggable_id", type: "manyToOne" },
			signature: { source_key: "taggable_id", type: "manyToOne" },
			tag: { source_key: "tag_id", type: "oneToOne" }
		}
	}

};