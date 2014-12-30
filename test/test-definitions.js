
// Definitions for a blog platform.
// Users write blog posts which can receive comments from other users.
// Blog posts have a many-to-many relationship to tags via the 
// posts_tags intermediate table.

module.exports = {

  users: {
    name: "users",
    as: "Users",
    columns: [
      { name: "id", as: "User ID" },
      { name: "name", as: "Full name" },
      { name: "created_at", as: "Join date" }
    ],
    joins: {
      posts: { target_key: "user_id" }, // "target_key" is the key used to join the foreign table.
      comments: { target_key: "user_id" } // When no "source_key" is specified, default is "id".
    }
  },

  posts: {
    name: "posts",
    as: "Blog Posts",
    columns: [
      { name: "id", as: "Post ID" },
      { name: "user_id", as: "Author" },
      { name: "text", as: "Text" },
      { name: "created_at", as: "Post Date" }
    ],
    joins: {
      users: { source_key: "user_id", as: "Author" }, // "source_key" is the key used to join this table.
      comments: { target_key: "post_id" },
      tags: { via: "posts_tags" },
      posts_tags: { target_key: "post_id" }
    }
  },

  comments: {
    as: "Comments",
    name: "comments",
    columns: [
      { name: "id", as: "Signature ID" },
      { name: "post_id", as: "Post ID" },
      { name: "user_id", as: "User ID" },
      { name: "message", as: "Comment"},
      { name: "created_at", as: "Comment Date" }
    ],
    joins: {
      users: { source_key: "user_id" },
      posts: { source_key: "post_id" }
    }
  },

  posts_tags: {
    name: "posts_tags",
    hidden: true, // Exclude table from schema.
    columns: [ "tag_id", "post_id" ], // Columns may be passed as array of strings.
    joins: {
      posts: { source_key: "post_id" },
      tags: { source_key: "tag_id" },
      users: { via: "posts" },
      posts: { source_key: "post_id" }
    }
  },

  tags: {
    name: "tags",
    as: "Tags",
    columns: [
      { name: "id", as: "Tag ID" },
      { name: "tag", as: "Tag" }
    ],
    joins: {
      posts_tags: { target_key: 'tag_id', hidden: true },
      users: { via: "posts_tags", as: "Related authors" },
      posts: { via: "posts_tags", as: "Related posts" }
    }
  }
};