var definitions = {

	user: {
		alias: "user",
		name: "users",
		columns: [
			"id",
			{ as: "joins date", name: "created_at" }
		],
		joins: {
			petition: { target_key: "user_id", type: "oneToMany" },
			signature: { target_key: "user_id", type: "oneToMany" },
			tag: { via: 'signature' }
		}
	},

	petition: {
		alias: "petition",
		name: "events",
		columns: [
			"id",
			{ as: "Start date", name: "created_at" }
		],
		joins: {
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
			{ as: "Sign date", name: "created_at" }
		],
		joins: {
			user: { source_key: "user_id", type: "manyToOne" },
			petition: { source_key: "petition_id", type: "manyToOne" },
			tag: { source_key: "petition_id", via: "taggings" }
		}
	},

	tag: {
		alias: "tag",
		name: "tags",
		columns: [ "id", "name" ],
		joins: { 
			taggings: { target_key: "tag_id", type: "oneToOne" }
		}
	},

	taggings: {
		alias: "taggings",
		name: "taggings",
		columns: [ "id", "tag_id", "taggable_id" ],
		joins: {
			petition: { source_key: "taggable_id", type: "manyToOne" },
			signature: { source_key: "taggable_id", type: "manyToOne" },
			tag: { source_key: "tag_id", type: "oneToOne" }
		}
	}

};


if (module && module.exports) { module.exports = definitions; }