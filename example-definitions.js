var definitions = {

	users: {
		name: "users",
		columns: [
			"id",
			{ as: "Join date", name: "created_at" }
		],
		joins: {
			petitions: { target_key: "user_id", type: "oneToMany", as: "User petitions" },
			signatures: { target_key: "user_id", type: "oneToMany", as: "User signatures" },
			tags: { via: 'signature', as: "Tags signed" }
		}
	},

	petitions: {
		name: "events",
		columns: [
			"id",
			{ as: "Start date", name: "created_at" }
		],
		joins: {
			users: { source_key: "user_id", type: "oneToOne", as: "Petition creator" },
			signatures: { target_key: "petition_id", type: "oneToMany", as: "Petition signatures" },
			tags: { via: "taggings", as: "Petition tags" }
		}
	},

	signatures: {
		alias: "signatures",
		name: "signatures_users",
		columns: [
			"id",
			"petition_id",
			"user_id",
			{ as: "Sign date", name: "created_at" },
		],
		joins: {
			users: { source_key: "user_id", type: "manyToOne", as: "Signer" },
			petitions: { source_key: "petition_id", type: "manyToOne", as: "Signature petition" },
			tags: { source_key: "petition_id", via: "taggings", as: "Signature tags" }
		}
	},

	tags: {
		name: "tags",
		columns: [ "id", "name" ],
		joins: {
			users: { via: "taggings", as: "Users signed" },
			petitions: { via: "taggings", as: "Petitions tagged" },
			taggings: { target_key: "tag_id", type: "oneToOne" }
		}
	},

	taggings: {
		name: "taggings",
		columns: [ "id", "tag_id", "taggable_id" ],
		joins: {
			petitions: { source_key: "taggable_id", type: "manyToOne" },
			signatures: { source_key: "taggable_id", type: "manyToOne" },
			tags: { source_key: "tag_id", type: "oneToOne" }
		}
	}

};


if (module && module.exports) { module.exports = definitions; }