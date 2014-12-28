var definitions = {

	users: {
		name: "users",
		as: "Users",
		columns: [
			{ name: "id" },
			{ name: "created_at", as: "Join date" }
		],
		joins: {
			petitions: { target_key: "user_id", type: "oneToMany", as: "Petitions created" },
			signatures: { target_key: "user_id", type: "oneToMany", as: "Signatures" },
			tags: { via: 'signatures', as: "Tags signed" }
		}
	},

	petitions: {
		name: "events",
		as: "Petitions",
		columns: [
			{ name: "id", as: "Petition ID" },
			{ name: "user_id", as: "Creator" },
			{ name: "created_at", as: "Date" }
		],
		joins: {
			users: { source_key: "user_id", type: "oneToOne", as: "Creator" },
			signatures: { target_key: "petition_id", type: "oneToMany", as: "Signatures" },
			tags: { via: "taggings", as: "Tags" },
			taggings: { target_key: 'taggable_id', hidden: true }
		}
	},

	signatures: {
		as: "Signatures",
		name: "signatures_users",
		columns: [
			{ name: "id", as: "Signature ID" },
			"petition_id",
			"user_id",
			{ as: "Sign date", name: "created_at" },
		],
		joins: {
			users: { source_key: "user_id", type: "manyToOne", as: "Signer" },
			petitions: { source_key: "petition_id", type: "manyToOne", as: "Petition signed" },
			tags: { source_key: "petition_id", via: "taggings", as: "Signature tags" },
			taggings: { source_key: "petition_id", target_key: "taggable_id", type: "manyToOne", hidden: true }
		}
	},

	tags: {
		name: "tags",
		as: "Tags",
		columns: [ "id", "name" ],
		joins: {
			taggings: { target_key: 'tag_id', hidden: true },
			users: { via: "taggings", as: "Users signed" },
			petitions: { via: "taggings", as: "Petitions tagged" },
			taggings: { target_key: "tag_id", type: "oneToOne" }
		}
	},

	taggings: {
		name: "taggings",
		as: "Taggings",
		columns: [ "id", "tag_id", "taggable_id" ],
		hidden: true,
		joins: {
			petitions: { source_key: "taggable_id", type: "manyToOne" },
			signatures: { source_key: "taggable_id", type: "manyToOne" },
			tags: { source_key: "tag_id", type: "oneToOne" }
		}
	}

};


if (module && module.exports) { module.exports = definitions; }