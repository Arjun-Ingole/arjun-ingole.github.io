---
layout: ../../layouts/BlogPostLayout.astro
title: 5000× faster by moving a single word
date: June 20, 2026
category: Engineering
readTime: 9 min read
---

a list view on our platform was taking around a minute to load when applied a certain kind of filter, naturally, my instinct was that something was wrong with the query aint no way the application logic is doing so much work pg_stat_activity suggested the same. at the first glance what I saw was the query was scanning through a large table filtering via attributes stored in a JSONB column, ahh yes that's the culprit right there, time to add new columns migrate the data and call it done, well i wish it was that simple. the problem was something worse

### Understanding how SQL works

here's what actually happens when you write a query more specifically a select query. sql is declarative you describe the result you want not how to get the result. when you write a query it doesnt carry the context on which table to scan first, which index to use, or how combine the tables, that's the job of the almighty query planner. 

the planner looks at your query, the tables described in the query, the indexes available for the query and some metadata (mostly statistical like how many rows does this table have, how many distinct value this table has and more) and then it generates multiple execution plans these are what gets actually executed but notice i said multiple. for each of these execution plans the planner also estimates the cost and runs with the cheapest one available.

what you should take away from the above statement is that main idea you should have when writing queries is to ensure the fastest plan is available for the query planner to discover. or a better way to put it would be you dont take the fastest plan off the plate.


So for example when your say give me "resources with this tag" <- basically a filter on the UI. assuming your resources are stored in one table and the tags for all the resources in another to handle all the business logic behind the tag. the query planner has generally two ways to go around looking for this

1. the nested loop - 
   for each record in the resources table look for a match in the tag table, this is kinda dangerous if the tables dont have indexes. As now we go through all the records in the resource table lets say N records and for each record we scan the entire tag table lets say the tag table has M records 
   
   so you can say you are doing M x N operations
   
2. the hash join -
   read the tag table once each time a tag satisfies, save the resource id against the tag in a hash set, this is called build phase, now that you already have the resource ids you can just get the final resources right? well yes but just sometimes. after the build phase we have a probe phase.
   
   if there are few matches you get the final results from looking up the resource ids you stored earlier
   
   if lets say more than half of the resource table's id satisfy the filter then its faster for the database to get the entire table and sweep through those as reading it all in one sweep and eliminate what you dont need beats getting huge number of scattered rows one at a time from the hardware. (this is a gross oversimplification)
   
   anyways at worst you doing M + N operations 

there's also merge join but i'll leave that part. But now you can see the difference is simple its product vs sum 

M x N > M + N as both of them are positive integer,  (found out there are exception to this as well, this doesnt hold true for if M and N are both 1 or 2, lmao)


### Subqueries, and the word "correlated"

a subquery is a query that is nested inside another,  (existence of sub query means dom query exists)

```sql
SELECT *
FROM records r <--- outer query
WHERE r.id IN (
  SELECT t.record_id <-- subquery
  FROM tags t ...
)
```

the query defined above means one simple thing keep the record if it appears in the set the subquery returns or like a semi join (at least one join)

but there are two versions of a subquery the bug we discovered lies the distinction

1. Non Correlated Subquery
   
   the subquery stands on its own, and its doesnt mention anything from the outer query.  so the answer for this query remains the same no matter which record you are looking at, so as you can guess the database computes such queries once
   
   for example 
   ```sql
	SELECT *
	FROM records r
	WHERE r.id IN (
	  SELECT t.record_id
	  FROM tags t
	  WHERE t.type   = 'REVIEW'
	    AND t.status = 'OPEN'
	)
   ```

	so here we only have to get all the tags that have the status OPEN and the type review, see how it doesnt depend on the record r for anything, so that tag related data is brought in once
   
2. Correlated Subquery 
   
   unlike the non correlated subquery, this one we depend on some property of the outer query, so the database has to rerun the subquery per record.
   
   for example
   ```sql
	SELECT *
	FROM records r
	WHERE r.id IN (
	  SELECT t.record_id
	  FROM tags t
	  WHERE t.type   = 'REVIEW'
	    AND t.status = 'OPEN'
	    AND t.owner_id = r.owner_id
	)
   ```
   
   so here we have to get all the tags that have the status OPEN, the type review and the owner or the resource and the tag is the same, so you see for every new record we have to rerun the subquery. forcing the query to scan the entire tags table where the conditions satisfy, now do that for each record thus we are back to our nested loop causing the N x M lookups

So before you guys flood my dms with messages such as "modern planners are clever enough to de-correlate automatically dumbass". well you are right, but then why didnt that happen to us? well in our case the query wasn't a simple equality check for two columns 

its was something like 

```sql
t.owner_id IS NULL OR t.owner_id = r.owner_id
```

whats the big deal here huh? IS NULL along with OR is an expression that the planner cant safely de-correlate and on top of that the t.owner_id wasnt even a column of it's own it was a value pulled out of a JSON blob which is a computed property. so don't rely on planner to save your ass.

### The actual skill, Reading an execution plan
in postgres (not very sure about other databases) you can run 

```sql
EXPLAIN (ANALYZE, BUFFERS) <query>
```

here's what the result would look like 

```
Seq Scan on tags  (cost=0.00..8683.29 rows=42 width=11)
                  (actual time=36.2..72.9 rows=73 loops=569)
  Filter: (...)
  Rows Removed by Filter: 154334
  Buffers: shared hit=1852208
```


you need to learn how to read the tree this results in, the inner most node runs first (basically the lines with the most indentation runs first, so dont fuck up the formatting when copying lol)

What you should look for is the node with the 
- biggest actual time x loops 
- anything with high loops
- anything that has huge rows removed by filter

ohhh i havent explained what these terms mean

1. cost : its a made up unit, not time. it tell how much work needs to be done for the node to finish, this doesnt give you wall clock so just use it to compare plans represented as 

   ```text
   startup..total
   cost=0.00..8683.29 (from our example above)
   startup -  work before the first row
   total - work to finish
   ```
   
2. rows / width : estimated rows returned and the average size of row in bytes
3. actual time : time per loop in milliseconds, this is per loop not total

   ```text
   startup..total
   actual time=36.2..72.9 same as cost but time
   ```

4. loops : how many times this node ran, in our example above the node ran 569 times
5. rows removed by filter : rows it read and then threw away. high numbers mean wasted reading, adding a index can help
6. buffers:

   ```text
   represented as 
   shared hit=1852208
   hit = found in cache
   read = from disk
   for our example  1,852,208 buffers = ~14 GB of page touches,
   as each page in postgres is 8 KB. so 1,852,208 × 8 KB = ~14.1 GB, well i'm cooked
   ```

and like i said before for calculating Total Time for a node is roughly ≈ actual total time × loops
this should help you debug a fucked up query easily by actually looking at facts rather than guessing or you can just give claude unrestricted access to your production database and ask it to "fix it"

### The Fix

a easy way to get around this problem is by joining the table inside the subquery itself. here's how it would look like in our example

```sql
SELECT *
	FROM records r
	WHERE r.id IN (
	  SELECT t.record_id
	  FROM tags t
	  JOIN records rr ON rr.id = t.record_id   -- bring the table IN
	  WHERE t.owner = rr.owner                  -- inner copy, not outer r
	)
```

why this is fast ? well the sub query doesn't actually have a correlation to the outer query, so this query can be computed once and then the outer query can hash join on the results of the subquery. 

this cuts the compute from M x N -> M + N

one thing to keep in mind in terms of correctness. a plain JOIN can result in multiple rows causing you to get duplicate rows, its safe in our example because there's at most one matching tag per record aka uniqueness guarantee, in general you should take measures for deduplication if this is not the case, you can add other filters on the join in the subquery itself.

What i ended up doing, apart from the fix written above
1. Precomputed column: as i told you before the join was on a computed property from a json blob, we added a precomputed column with is like a mild denormalization, so we can do the look up much much much faster
2. Index: turns the remaining read from a full scan (read everything, discard almost everything) it can go straight to the row. mind you this index was on the newly added column

Finally the performance numbers

Original,  Correlated + JSON computed property, no column, no index
Time: 41,517 ms
Why: 569 loops × full scan of 155k rows × JSON parsing per row

step 1. decorrelation, non-correlated, still JSON computed property, no index
Time: 39 ms
Why: Loops = 1. One full scan of 155k rows, parsing JSON per row — but only once. (This was actually measured on staging environment.)

Thats already 1064 x better

step: 2. non-correlated + precomputed column, no index
Time: ~35 ms
Why: Still one full scan of 155k rows, but now checking a boolean instead of parsing 5 JSON fields

step: 3. index, non-correlated + column + index
Time: 8 ms
Why: the db looks into ~109 rows instead of one scan of 155k. The scan is eliminated entirely

thats 5190 x better that what we started with


| Order                          | Original  | After step 1  | After step 2  | After step 3 |
| ------------------------------ | --------- | ------------- | ------------- | ------------ |
| Decorrelation → Column → Index | 41,517 ms | 39 ms (1064x) | 35 ms (1186x) | 8ms (5190x)  |

these numbers were actually measured on staging environment, on production over network what we observed was a request that took 1.1 min (66000 ms) went down to  83 ms thats around 800x improvement, over network


for those who would still argue slapping a index would've fixed this issue as well, true but indexes come up with their own overhead, writes get a lil slower, storage use jumps and it would've fixed the problem for a while as the table grows the problem would've resurfaced eventually and then the query times wouldn't be in the ball parks of 40 seconds so most of just would just end up blaming "the table is too big" and moving on
