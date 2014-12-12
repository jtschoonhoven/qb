{

	user: {
		alias: "user",
		table: "users",
		columns: [
			"id",
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
			"id",
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
			"id",
			{ name: "Sign date", property: "TO_CHAR(signatures_users.created_at, 'YYYY-MM-DD')" }
		]
	},

	tag: {
		alias: "tag",
		table: "tags",
		columns: []
	},

	taggings: {
		alias: "taggings",
		table: "taggings",
		columns: [ "tag_id", "taggable_id"]
	}

}
