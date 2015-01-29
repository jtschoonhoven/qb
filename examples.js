
// Create an instance of Query Builder
// ==================================================
// Require package and instantiate a new Qb.
// Pass in model definitions and SQL flavor.
// More examples in define.test.js.

var definitions = require('./example-definitions');
var Qb = require('./lib');
var qb = new Qb(definitions, 'postgres');



// Register custom functions (optional)
// ==================================================
// Qb already includes common aggregates like COUNT
// and SUM, but not functions like MONTH.
// More examples in register-functions.test.js.

// Register a MONTH function.
qb.registerFunction('MONTH');

// Register a function with prefilled argument.
// TO_MONTH will become DATE_TRUNC('MONTH', [arg])

qb.registerFunction('TO_MONTH', 'DATE_TRUNC', 'MONTH');

// Advanced: combine two functions.
qb.functions.COUNT_DISTINCT = function(field) {
  return field.count().distinct();
};



// Building simple SELECT statements
// ==================================================
// More examples in select.test.js and join.test.js.

// Select a single field.
var spec  = { select: 'id', from: 'users' };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID" 
// FROM "users" AS "Users"


// Select multiple fields.
var spec  = { select: ['id', 'name'], from: 'users' };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID", "Users"."name" AS "Full name" 
// FROM "users" AS "Users"


// Select using a different alias from that defined.
var spec  = { select: { name: 'id', as: 'uid' }, from: 'users' };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "uid" 
// FROM "users" AS "Users"



// Using functions
// ==================================================
// More examples in register-functions.test.js.

// Using a builtin function.
var spec  = { select: ['user_id', { name: 'id', functions: 'count' }], from: 'posts' };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Blog Posts"."user_id" AS "Author", COUNT("Blog Posts"."id") AS "Post ID_count" 
// FROM "posts" AS "Blog Posts"


// Using a registered function.
var spec  = { select: ['id', { name: 'created_at', functions: 'TO_MONTH', as: 'month' }], from: 'users' };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID", DATE_TRUNC('MONTH', "Users"."created_at") AS "month" 
// FROM "users" AS "Users"


// Using nested functions.
var spec  = { select: ['user_id', { name: 'id', functions: ['count', 'distinct'] }], from: 'posts' };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Blog Posts"."user_id" AS "Author", COUNT(DISTINCT("Blog Posts"."id")) AS "Post ID_distinct_count" 
// FROM "posts" AS "Blog Posts"



// Adding JOIN clauses
// ==================================================
// More examples in join.test.js.

// Simple JOIN.
var spec  = { select: 'id', from: 'users', join: 'posts' };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID" 
// FROM "users" AS "Users" 
// INNER JOIN "posts" AS "Blog Posts" ON ("Users"."id" = "Blog Posts"."user_id")


// Select columns from two tables.
var spec  = { select: [{ name: 'id', joinId: 'u' }, { name: 'id', joinId: 'p' }], from: { name: 'users', id: 'u' }, join: { name: 'posts', id: 'p' } };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID", "Blog Posts"."id" AS "Post ID" 
// FROM "users" AS "Users" 
// INNER JOIN "posts" AS "Blog Posts" ON ("Users"."id" = "Blog Posts"."user_id")


// JOIN via an intermediate table.
var spec  = { select: 'tag', from: 'tags', join: 'posts' };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Tags"."tag" AS "Tag" 
// FROM "tags" AS "Tags" 
// INNER JOIN "posts_tags" ON ("Tags"."id" = "posts_tags"."tag_id") 
// INNER JOIN "posts" AS "Blog Posts" ON ("posts_tags"."post_id" = "Blog Posts"."id")


// Adding WHERE clauses
// ==================================================
// More examples in where.test.js.

// Filter against a constant.
var spec  = { select: 'id', from: 'users', where: { field: 'id', match: { value: 1 } } };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID" 
// FROM "users" AS "Users" 
// WHERE ("Users"."id" = 1)


// Filter against a column.
var spec  = { select: 'id', from: 'users', where: { field: 'id', match: 'name' } };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID"
// FROM "users" AS "Users"
// WHERE ("Users"."id" = "Users"."name")


// Filter with AND logic.
var spec  = { select: 'id', from: 'users', where: [{ field: 'id', match: { value: 1 } }, { field: 'name', match: { value: 'Bork' }}] };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID"
// FROM "users" AS "Users"
// WHERE (("Users"."id" = 1) AND ("Users"."name" = 'Bork'))


// Filter with OR logic.
var spec  = { select: 'id', from: 'users', where: { or: [{ field: 'id', match: { value: 1 } }, { field: 'name', match: { value: 'Bork' }}] }};
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID"
// FROM "users" AS "Users"
// WHERE (("Users"."id" = 1) OR ("Users"."name" = 'Bork'))


// Filter with a comparison operator (see where.test.js for a complete list)
var spec  = { select: 'id', from: 'users', where: { field: 'id', op: 'gt', match: { value: 42 }}};
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID"
// FROM "users" AS "Users"
// WHERE ("Users"."id" > 42)



// Using GROUP BY, ORDER BY, & LIMIT
// ==================================================
// More examples group-by.test.js, order-by.test.js, 
// & limit.test.js

// GROUP BY.
var spec  = { select: { name: 'id', groupBy: true }, from: 'users' };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID"
// FROM "users" AS "Users"
// GROUP BY "Users"."id"


// ORDER BY.
var spec  = { select: { name: 'id', orderBy: 'desc' }, from: 'users' };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID"
// FROM "users" AS "Users"
// ORDER BY "Users"."id" DESC


// LIMIT.
var spec  = { select: 'id', from: 'users', limit: 1000 };
var query = qb.query(spec);
console.log(query.formatted + '\n');

// SELECT "Users"."id" AS "User ID"
// FROM "users" AS "Users"
// LIMIT 1000
