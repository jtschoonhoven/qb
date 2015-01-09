Query Builder
=============

*Yet another Javascript SQL generator for Node.*  
*Built atop [brianc/node-sql](https://github.com/brianc/node-sql), thus supports supports postgres, mysql, and sqlite.*



Query Builder gets you, man.
----------------------------

When you create a `new Qb()` you pass in an object that defines your tables and how they relate. And because QB "gets" you, it handles the boring stuff. So that you can focus on *you*.

Instead of method chaining something like,
```javascript
query().select([users.id.as('User'), users.id.count(1)])
    .from(users).join(posts)
    .on(posts.user_id).equals(users.id)
    .groupBy(users.id);
```

Qb accepts an object. Like,
```javascript
{ select: ['id', {function: 'count', value: 1}], join: ['users', 'posts'] }
```

Anything you leave out of the object will be filled in with smart defaults based on your model definitions.



Query Builder for BI Applications
---------------------------------

*Wouldn't it be great if nonengineers could query your database without having to learn SQL or the nuances of your particular schema? Query builder was written with this in mind.*

**Qb is ready for your API**.  
Because it already accepts JSON, you can plug a POST body directly into Qb.query.

**Qb only selects from tables/columns you have defined**.  
Your "unhashed_passwords" table is safe, at least from us.

**Qb has context builtin**  
Tables may have a different default alias depending on what table they are joined on. For example your "users" table might always be aliased "Vendors" when joined from the "inventory" table, but called "Customers" when joined from the "orders" table.

**Qb does complex joins automatically**  
Once you have defined a schema, Qb knows that "orders" is joined to "users" by the orders.user_id column and that "orders" is joined to "categories" via an "orders_categories" intermediate table. So all you have to type is `{ join: ['users', 'orders'] }` in the first case or `{ join: ['users', 'orders_categories'] }` in the second. You could even perform a four part join from users to orders_categories with `{ join: ['users', 'orders_categories'] }`.

**Qb is secure**  
You can define a table to Qb that is hidden to users. So you can still join through "unhashed_passwords" without revealing the table in qb.schema. And of course query output is parameterized.



Examples
--------

...are forthcoming. In the meantime, the tests directory is chock full of example code.



Contributing
------------

Please do. Any reasonable PR will be merged so long as it has test coverage.