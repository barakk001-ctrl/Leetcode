window.LC_WEEKS = window.LC_WEEKS || [];
window.LC_WEEKS.push({
  week: 9,
  title: "Architecture & System Design",
  goal: "Answer backend design and architecture questions out loud: requirements, API, data model, scaling, trade-offs.",
  patterns: ["System Design", "Databases", "Caching", "Async & Queues", "Auth"],
  questions: [
    {
      id: "url-shortener",
      title: "Design a URL Shortener",
      difficulty: "Medium",
      url: "",
      pattern: "System Design",
      summary: "Design a service like bit.ly: given a long URL, return a short link that redirects to it.",
      hints: [
        "Ask first: how many new URLs per day and what read/write ratio? Custom aliases? Expiration? Analytics on clicks? Global or single region?",
        "Expected pieces: POST /shorten and GET /{code} APIs, a key-generation strategy (counter + base62 vs random), a urls table keyed by code, heavy read-side cache, 301 vs 302 redirect decision."
      ],
      explanation: `I'd start by scoping: say 100M new URLs per day and a 100:1 read/write ratio. That's about 1.2K writes/s and 100K+ reads/s at peak — so this is a read-heavy system and the redirect path is what I optimize. Storage: 100M/day * 365 * ~500 bytes is on the order of 20 TB/year, fine for a sharded store.

API is two endpoints: POST /api/shorten takes the long URL (plus optional custom alias and TTL) and returns the short code; GET /{code} does the redirect. I'd return 302 (or 307) rather than 301 if the business wants click analytics, because a 301 gets cached by browsers and we never see repeat clicks. 301 is more efficient if we don't care.

For key generation I'd use a distributed counter (e.g. ranges of IDs handed out to app instances) and base62-encode the ID. 7 base62 chars gives 62^7 ≈ 3.5 trillion codes — decades of headroom. This avoids the collision-check loop you get with random codes and avoids hashing pitfalls (hash of same URL colliding with custom aliases). Data model is a single table: code (PK), long_url, created_at, expires_at, owner. It shards naturally by code.

Scaling the read path: cache-aside in Redis keyed by code with a TTL; hot links follow a power law so a modest cache gets a very high hit rate. Put the redirect service behind a CDN/edge if global. Writes go straight to the DB — 1.2K/s is easy. Trade-offs I'd call out: counter-based codes are enumerable (mitigate by permuting/salting the ID if privacy matters), and 301 vs 302 trades browser caching efficiency against analytics.`,
      pitfalls: [
        "Jumping straight to architecture without stating scale numbers — 1.2K writes/s tells you a lot of complexity is unnecessary",
        "Using MD5-of-URL truncated to 6 chars and hand-waving collisions",
        "Not knowing the 301 vs 302 trade-off when asked about redirects",
        "Proposing microservices and Kafka for what is essentially a key-value lookup"
      ],
      kotlin: `object Base62 {
    private const val ALPHABET =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

    fun encode(id: Long): String {
        var n = id
        val sb = StringBuilder()
        while (n > 0) {
            sb.append(ALPHABET[(n % 62).toInt()])
            n /= 62
        }
        return sb.reverse().toString()
    }
}
// id 1_000_000_007 -> "15ftgG" ; 62^7 ~ 3.5e12 codes`,
      complexity: "Anchor: 100M URLs/day ≈ 1.2K writes/s, 100:1 read-heavy — optimize the redirect path"
    },
    {
      id: "rate-limiter",
      title: "Design a Rate Limiter",
      difficulty: "Medium",
      url: "",
      pattern: "System Design",
      summary: "Design a rate limiter that caps how many requests a client can make to our API, e.g. 100 requests per minute per user.",
      hints: [
        "Ask first: limit per user, per IP, or per API key? Hard limit or allow bursts? Single server or distributed fleet? What happens on limit — reject with 429 or queue?",
        "Expected pieces: token bucket (or sliding window counter) algorithm, Redis with atomic Lua/INCR for distributed state, middleware placement at the gateway, 429 + Retry-After response."
      ],
      explanation: `First I'd clarify the policy: say 100 requests/minute per API key, bursts allowed, enforced across a fleet of stateless API servers, and over-limit requests get a 429 with a Retry-After header rather than being queued.

Algorithm choice: token bucket is my default. Each key has a bucket with capacity (burst size) and a refill rate; a request takes a token, and if the bucket is empty it's rejected. It's O(1) memory per key — just two numbers, tokens and last-refill timestamp — and it handles bursts gracefully. Fixed windows are simpler but allow 2x traffic at window edges; sliding window log is exact but stores every timestamp; sliding window counter is a good middle ground if the interviewer pushes on token bucket's burstiness.

Because the servers are stateless, the state lives in Redis: key = api key, value = tokens + timestamp. The read-modify-write must be atomic, so I'd do it in a single Lua script (or use Redis 7 functions) — otherwise two servers race and both grant the last token. Latency budget: one Redis round trip per request, ~1ms, acceptable at the gateway. At very high scale I'd move to a local in-process limiter with slightly relaxed global accuracy, or shard Redis by key.

Trade-offs to say out loud: strict global accuracy vs latency (centralized Redis is accurate but adds a hop; local counters are fast but approximate), and fail-open vs fail-closed if Redis is down — I'd fail open for a public API to avoid a self-inflicted outage, and say so explicitly.`,
      pitfalls: [
        "Describing a fixed window counter without mentioning the 2x burst at window boundaries",
        "Storing bucket state in server memory and forgetting the fleet is load-balanced",
        "Non-atomic check-then-set against Redis — race condition under load",
        "Not deciding fail-open vs fail-closed when the limiter's store is down"
      ],
      kotlin: `class TokenBucket(
    private val capacity: Double,
    private val refillPerSec: Double
) {
    private var tokens = capacity
    private var last = System.nanoTime()

    @Synchronized
    fun tryAcquire(): Boolean {
        val now = System.nanoTime()
        val elapsedSec = (now - last) / 1e9
        tokens = minOf(capacity, tokens + elapsedSec * refillPerSec)
        last = now
        if (tokens < 1.0) return false
        tokens -= 1.0
        return true
    }
}
// Distributed version: same logic as an atomic Redis Lua script keyed by apiKey`,
      complexity: "Anchor: token bucket = 2 numbers per key + atomic update; decide fail-open vs fail-closed"
    },
    {
      id: "news-feed",
      title: "Design a News Feed",
      difficulty: "Hard",
      url: "",
      pattern: "System Design",
      summary: "Design the home feed for a social app: users follow other users and see their posts, newest first.",
      hints: [
        "Ask first: how many DAU, average follows per user, posts per day? Is the feed chronological or ranked? How fresh must it be? What about celebrity accounts with millions of followers?",
        "Expected pieces: fanout-on-write vs fanout-on-read, per-user feed cache (Redis list), posts service + follow graph, hybrid approach for celebrities, cursor-based feed API."
      ],
      explanation: `Scoping: say 10M DAU, each follows 200 accounts, 1M posts/day, feed is reverse-chronological, and freshness within a few seconds is fine. Reads dominate massively — every app open is a feed read — so the core question is: do we build the feed at write time or at read time?

Fanout-on-write (push): when a user posts, we push the post ID into a precomputed feed list for every follower — a Redis list per user, capped at say 500 entries. Feed reads become a single cache fetch: fast and cheap. The cost is write amplification: a post by someone with 5M followers means 5M pushes. Fanout-on-read (pull): store posts once; at read time, fetch recent posts from all 200 followees and merge. Cheap writes, expensive reads.

The standard answer is hybrid: push for normal users, pull for celebrities above a follower threshold (say 100K). At read time you take your precomputed list and merge in recent posts from the few celebrities you follow. Fanout happens async — the post write returns immediately, a queue of fanout workers does the pushes — so a slow fanout never blocks posting.

API: GET /feed?cursor=...&limit=20 with cursor pagination (cursor = last seen post ID/timestamp), never offset pagination, because the feed shifts under you. Data model: posts table sharded by post ID, follows table sharded by follower, feed cache in Redis. Trade-offs to state: hybrid adds complexity but caps both write amplification and read fan-in; precomputed feeds mean a deleted post needs lazy filtering at read time; and ranking (if required) moves the merge step into a scoring service but doesn't change the fanout story.`,
      pitfalls: [
        "Picking pure push or pure pull without mentioning the celebrity problem",
        "Doing fanout synchronously inside the POST /post request",
        "Offset-based pagination on a mutating feed — duplicates and gaps",
        "No cap on precomputed feed length, so Redis memory grows unbounded"
      ],
      kotlin: `// Async fanout worker: consume post events, push to follower feeds
fun onPostCreated(event: PostEvent) {
    if (followerCount(event.authorId) > CELEB_THRESHOLD) return // pull side handles
    followerIdsOf(event.authorId).chunked(1000).forEach { batch ->
        batch.forEach { fid ->
            redis.lpush("feed:" + fid, event.postId.toString())
            redis.ltrim("feed:" + fid, 0, 499) // cap feed length
        }
    }
}
// Read path: LRANGE feed:{userId} + merge recent posts of followed celebs`,
      complexity: "Anchor: hybrid fanout — push for normal users, pull for >100K-follower accounts"
    },
    {
      id: "notification-system",
      title: "Design a Notification System",
      difficulty: "Medium",
      url: "",
      pattern: "System Design",
      summary: "Design a system that sends users notifications over push, email, and SMS, triggered by events from other services.",
      hints: [
        "Ask first: which channels and volumes per day? Can we drop notifications or must delivery be guaranteed? Are there user preferences/opt-outs, dedup, rate caps per user, scheduling?",
        "Expected pieces: event queue in front, notification service that resolves preferences + templates, per-channel workers (APNs/FCM, SES, Twilio), retry with backoff + DLQ, idempotency key per notification."
      ],
      explanation: `Clarify first: say 50M notifications/day across push, email, SMS — about 600/s average, spiky. Producers are other services (order shipped, friend request). At-least-once delivery is required for transactional messages; marketing can be best-effort. Users have per-channel preferences and quiet hours.

Architecture: producers don't call providers directly — they publish a NotificationRequested event to a queue (Kafka or SQS). That decouples them from provider latency and outages, absorbs spikes, and gives retries for free. A notification service consumes the event, looks up the user's preferences and device tokens, checks opt-outs and per-user rate caps (nobody wants 40 pushes an hour), renders the template, and fans out one message per chosen channel onto per-channel queues.

Per-channel workers integrate with the actual providers: APNs/FCM for push, SES/SendGrid for email, Twilio for SMS. Each worker retries with exponential backoff on transient provider errors and dead-letters after N attempts. Because retries mean possible duplicates, every notification carries an idempotency key (event ID + user + channel) and the send is recorded in a delivery-log table first — dedup before hitting the provider, so a user never gets the same SMS twice.

Data model: notification templates, user preferences, device tokens (with cleanup on FCM "unregistered" responses), and a delivery log for status tracking and analytics. Trade-offs: queue-based design gives at-least-once, so idempotency is mandatory; prioritization matters — OTP codes should ride a separate high-priority queue so a marketing blast never delays them.`,
      pitfalls: [
        "Producers calling Twilio/FCM synchronously in the request path",
        "Ignoring dedup — retries plus at-least-once means duplicate SMS to users",
        "Forgetting user preferences, opt-outs, and per-user rate caps entirely",
        "One shared queue so bulk marketing sends delay OTP/transactional messages"
      ],
      kotlin: `fun handle(event: NotificationEvent) {
    val key = event.id + ":" + event.userId + ":" + event.channel
    // dedup: first writer wins, replays are no-ops
    val fresh = redis.set("sent:" + key, "1", SetParams().nx().ex(86400))
    if (fresh == null) return
    val prefs = prefStore.forUser(event.userId)
    if (!prefs.allows(event.channel, event.category)) return
    channelQueue(event.channel).publish(render(event, prefs))
}
// Worker side: retry w/ exponential backoff, dead-letter after 5 attempts`,
      complexity: "Anchor: at-least-once via queues => idempotency key per (event, user, channel) is mandatory"
    },
    {
      id: "async-job-queue",
      title: "Design an Async Job Queue",
      difficulty: "Hard",
      url: "",
      pattern: "System Design",
      summary: "Design a background job system: services submit jobs (resize image, send report) and workers execute them reliably.",
      hints: [
        "Ask first: job volume and duration? Delivery guarantee needed? Are jobs idempotent? Do we need delayed/scheduled jobs, priorities, or ordering? What happens when a worker dies mid-job?",
        "Expected pieces: broker choice (SQS/RabbitMQ/Kafka vs Postgres SKIP LOCKED), visibility timeout / ack model, retries with backoff + dead-letter queue, idempotent handlers, job status table."
      ],
      explanation: `Clarify: say 1K jobs/s, jobs run 100ms–5min, at-least-once execution required, and we need delayed jobs and retries. The first real decision is the broker. At modest scale I'd genuinely push back on new infrastructure: a Postgres jobs table with SELECT ... FOR UPDATE SKIP LOCKED gives you a transactional queue, and enqueueing a job in the same transaction as your business write eliminates a whole class of dual-write bugs. Above roughly tens of thousands of jobs/s, move to SQS or RabbitMQ; Kafka only if you need ordered streams and replay rather than a work queue.

The core reliability mechanism is the ack model: a worker leases a job (visibility timeout in SQS, unacked message in RabbitMQ, or a locked_until column in Postgres). If the worker crashes, the lease expires and the job becomes visible again. That's what gives at-least-once — and it means a job can run twice, so handlers must be idempotent: keyed writes, upserts, or a processed-jobs dedup table checked at the start of each handler.

Failure handling: retry with exponential backoff and jitter; after N attempts, move to a dead-letter queue with the error attached, and alert on DLQ depth — a growing DLQ is your main health signal. Long-running jobs heartbeat to extend their lease so they aren't double-executed while still alive. Delayed jobs: native in SQS (up to 15 min) or a run_at column you index and poll in Postgres.

Trade-offs to state: at-least-once + idempotency is the pragmatic choice — true exactly-once end-to-end is a myth once side effects leave your database. Also mention poison-pill isolation (one bad job must not block the queue) and per-tenant fairness if one tenant can flood the system.`,
      pitfalls: [
        "Reaching for Kafka by default when a work queue (or Postgres SKIP LOCKED) fits better",
        "No visibility-timeout/lease story — jobs lost forever when a worker dies",
        "Claiming exactly-once delivery instead of at-least-once + idempotent handlers",
        "No dead-letter queue, so a poison-pill job retries forever and clogs workers"
      ],
      kotlin: `-- Postgres as a job queue: atomic claim, crash-safe
UPDATE jobs SET status = 'running', locked_until = now() + interval '5 min'
WHERE id = (
  SELECT id FROM jobs
  WHERE status = 'pending' AND run_at <= now()
  ORDER BY priority DESC, run_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING id, payload;
-- worker heartbeats extend locked_until; a reaper re-pends expired leases
CREATE INDEX idx_jobs_claim ON jobs (status, run_at) WHERE status = 'pending';`,
      complexity: "Anchor: lease + timeout gives at-least-once — so every handler must be idempotent"
    },
    {
      id: "sql-vs-nosql",
      title: "SQL vs NoSQL — When and Why",
      difficulty: "Easy",
      url: "",
      pattern: "Concept",
      summary: "When would you choose a NoSQL database over a relational one, and what do you give up?",
      hints: [
        "Probing: do you have a decision framework based on access patterns and consistency needs, or do you just repeat 'NoSQL scales'?",
        "Must include: ACID transactions and joins vs horizontal partitioning, known query patterns vs ad-hoc queries, document/KV/wide-column/graph families, and that Postgres scales further than people assume."
      ],
      explanation: `My default is Postgres, and I'd say that up front. Relational gives me ACID transactions, joins, ad-hoc queries, constraints, and forty years of tooling. I reach for NoSQL when I have a specific reason, not for scale I don't have yet — a single well-tuned Postgres instance with read replicas comfortably handles tens of thousands of QPS and terabytes of data, which covers most businesses.

The real decision axis is access patterns and consistency, not "scale". NoSQL stores (DynamoDB, Cassandra) get their horizontal scalability by making you denormalize around known queries: you model the table for the query, partition by a key, and give up joins, multi-row transactions, and flexible querying. That's a great trade when the access pattern is fixed and huge — session storage, user profiles by ID, event firehoses, shopping carts. It's a terrible trade when product requirements are still evolving and someone will ask for a new report next month.

Families matter too: key-value (Redis, Dynamo) for lookups by key; document (Mongo) for nested aggregates read as a unit; wide-column (Cassandra) for write-heavy time-series at scale; graph (Neo4j) for traversal-heavy data. And the line has blurred — Postgres has JSONB for schemaless bits, and NewSQL systems (Spanner, CockroachDB) offer SQL semantics over horizontal sharding at a latency and operational cost.

Concrete example from a backend I'd describe: orders, payments, and inventory stay in Postgres because they need transactions and reporting; user sessions and a hot device-token lookup go to Redis/DynamoDB because they're pure key lookups at high QPS with no relational needs. Polyglot, but each store chosen for a stated reason.`,
      pitfalls: [
        "Answering 'NoSQL is for scale, SQL is for structure' with no access-pattern reasoning",
        "Not knowing what you give up: joins, multi-row ACID, ad-hoc queries",
        "Treating NoSQL as one thing — KV, document, wide-column and graph solve different problems",
        "Underestimating how far a single Postgres with replicas actually goes"
      ],
      kotlin: `// Same data, two models — the access pattern decides.
// SQL: normalized, joinable, transactional
// orders(id, user_id, status) / order_items(order_id, sku, qty)

// DynamoDB: denormalized around the one query "get cart by user"
data class CartItem(val sku: String, val qty: Int, val price: Long)
data class CartRecord(          // partition key = userId
    val userId: String,
    val items: List<CartItem>,  // embedded — no join at read time
    val updatedAt: Long
)
// One-key read, infinite horizontal scale; but "carts containing SKU X"
// now needs a GSI or a scan — you pay for flexibility you gave up.`,
      complexity: "Anchor: choose by access pattern + consistency needs, not by hype — default Postgres"
    },
    {
      id: "db-indexing",
      title: "How Database Indexes Work",
      difficulty: "Medium",
      url: "",
      pattern: "Concept",
      summary: "How does a database index actually work, and why not just index every column?",
      hints: [
        "Probing: do you understand B-trees and I/O cost, or is an index a magic 'makes it fast' box? Expect follow-ups on composite index column order and why a query ignored your index.",
        "Must include: B-tree structure and O(log n) lookups, write amplification per index, composite indexes and the leftmost-prefix rule, covering indexes, selectivity, when a scan beats an index."
      ],
      explanation: `An index is a separate sorted structure — almost always a B-tree — that maps column values to row locations. Because it's sorted and shallow (3–4 levels even for hundreds of millions of rows), the database finds a value in a handful of page reads instead of scanning the table: O(log n) I/Os versus O(n). B-trees also handle range queries and ORDER BY, because the leaves are in sorted order and linked. Hash indexes are equality-only; that's why B-tree is the default everywhere.

Why not index everything: every index is a second data structure that must be updated on every INSERT/UPDATE/DELETE — write amplification — plus extra storage and buffer-pool pressure. Five indexes on a hot table roughly means six writes per row change. Indexes are a read-vs-write trade, so you index what your queries actually filter and sort on, and you drop unused ones.

Composite indexes are where interviews go next: an index on (user_id, created_at) serves WHERE user_id = ? and WHERE user_id = ? AND created_at > ?, but not a query on created_at alone — the leftmost-prefix rule, because the tree is sorted by user_id first. Order columns by equality filters first, then the range/sort column. A covering index includes every column the query needs, so the engine answers from the index alone and skips the table lookup entirely — that's often the single biggest win for a hot query.

Two more things a strong answer mentions: selectivity — the planner will rightly ignore an index on a low-cardinality column like status when 40% of rows match, since random-access via index is slower than a sequential scan at that point; and how to verify — I don't guess, I run EXPLAIN ANALYZE and look for sequential scans on large tables and rows-estimated vs rows-actual mismatches.`,
      pitfalls: [
        "Saying 'indexes make reads fast' without the write-amplification cost",
        "Not knowing the leftmost-prefix rule for composite indexes",
        "Never mentioning EXPLAIN — claiming to tune queries without measuring",
        "Missing that low selectivity makes the planner skip the index, correctly"
      ],
      kotlin: `-- Query: user's recent orders, newest first
-- SELECT id, status, total FROM orders
-- WHERE user_id = ? AND created_at > ? ORDER BY created_at DESC;

-- Composite: equality column first, then range/sort column
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);

-- Covering variant: answers the query from the index alone (no heap visit)
CREATE INDEX idx_orders_user_created_cov
  ON orders (user_id, created_at DESC) INCLUDE (status, total);

-- Wrong order (created_at, user_id) can't serve "user_id = ?" alone:
-- leftmost-prefix rule. Verify with: EXPLAIN (ANALYZE, BUFFERS) SELECT ...`,
      complexity: "Anchor: B-tree = O(log n) reads bought with write amplification; composite order = equality, then range"
    },
    {
      id: "caching-strategies",
      title: "Caching Strategies & Invalidation",
      difficulty: "Medium",
      url: "",
      pattern: "Concept",
      summary: "What caching strategies do you know, and how do you keep the cache consistent with the database?",
      hints: [
        "Probing: can you go beyond 'we use Redis' — do you know the failure modes: stale data, stampedes, and the write-ordering races?",
        "Must include: cache-aside vs read/write-through vs write-behind, TTLs, invalidation on write (delete not update), thundering herd protection, and why cache+DB can still race."
      ],
      explanation: `The workhorse pattern is cache-aside: the application reads the cache first; on a miss it reads the DB and populates the cache with a TTL; on a write it updates the DB and then deletes the cache key. I delete rather than update the cached value on writes, because two concurrent writes updating the cache can interleave and leave the cache holding the older value forever — a delete just forces the next reader to reload. The alternatives — read-through/write-through (the cache sits in line and loads/stores itself) and write-behind (cache absorbs writes, flushes async, fast but can lose data on crash) — are worth naming, but cache-aside plus TTL is what most backends actually run.

Invalidation is the hard part, and I'd be honest that cache-aside is not perfectly consistent: there's a classic race where a reader misses, reads the DB, stalls, a writer updates the DB and deletes the key, and then the stale reader populates the cache with old data. TTL is the backstop that bounds how long any such staleness can live — every key gets one, no exceptions. If the business needs tighter consistency, invalidate via CDC (e.g. Debezium reading the DB log and deleting keys), or don't cache that data.

Operational failure modes worth naming: thundering herd — a hot key expires and 10K requests hit the DB simultaneously; fix with per-key locking (only one loader, others wait) or probabilistic early refresh, and jitter TTLs so a deploy-time mass-fill doesn't expire all at once. Cache penetration — repeated lookups of nonexistent keys bypass the cache every time; fix by caching negative results briefly.

Concrete example: product pages at 50K reads/s over ~1M products — cache-aside in Redis, 5-minute jittered TTL, delete-on-write from the product service, singleflight loading for hot keys. That takes 99%+ of reads off the DB while bounding staleness to minutes, which the business confirmed is fine — and stating that staleness budget out loud is the mark of a real answer.`,
      pitfalls: [
        "Updating the cache on write instead of deleting — the write-write race leaves stale data with no TTL rescue",
        "No TTL 'because we invalidate correctly' — there is always a leak path",
        "Never mentioning thundering herd / stampede on hot key expiry",
        "Claiming cache-aside is strongly consistent — it isn't; state the staleness budget"
      ],
      kotlin: `suspend fun getProduct(id: Long): Product {
    val key = "product:" + id
    cache.get(key)?.let { return it }
    return singleflight(key) {            // one loader per key, herd waits
        cache.get(key) ?: db.findProduct(id).also {
            val ttl = 300 + Random.nextLong(60) // jitter to spread expiry
            cache.set(key, it, ttlSeconds = ttl)
        }
    }
}

fun updateProduct(p: Product) {
    db.save(p)
    cache.delete("product:" + p.id)       // delete, don't update
}`,
      complexity: "Anchor: cache-aside + delete-on-write + jittered TTL; always state the staleness budget"
    },
    {
      id: "idempotency-retries",
      title: "Idempotency, Retries & Exactly-Once",
      difficulty: "Medium",
      url: "",
      pattern: "Concept",
      summary: "A client retries a payment request after a timeout — how do you make sure the customer isn't charged twice?",
      hints: [
        "Probing: do you understand that a timeout is an ambiguous outcome, and that safety must be built server-side — plus whether you know exactly-once is really at-least-once + dedup?",
        "Must include: idempotency keys with a unique constraint, storing and replaying the first response, retries with backoff + jitter, the outbox pattern for DB+queue dual writes, at-least-once vs exactly-once."
      ],
      explanation: `The key insight is that a timeout is ambiguous: the client doesn't know if the charge happened. So retries are necessary for reliability, and therefore the server must make the operation safe to repeat. The standard mechanism is an idempotency key: the client generates a UUID per logical operation (not per attempt) and sends it as a header; the server inserts it into an idempotency table with a unique constraint in the same transaction as the business write. A retry hits the constraint, and the server returns the stored response from the first attempt instead of executing again. Same request, same effect, same response — that's idempotency. Stripe's API works exactly this way.

Details that make it production-grade: the key insert and the business change must be atomic (same DB transaction), otherwise a crash between them breaks the guarantee. Store the response (status + body) with the key so replays return the original result, including original failures. Scope keys per endpoint and give them a TTL (24h is typical). And handle the concurrent-retry case: two in-flight requests with the same key — first one wins, second either waits or gets a 409.

On retries themselves: exponential backoff with jitter, a retry budget, and only retry idempotent operations or ones made idempotent by keys — otherwise retries amplify outages. The related trap is the dual write: saving an order to the DB and publishing an event to Kafka is two systems with no shared transaction. The fix is the outbox pattern — write the event into an outbox table in the same DB transaction, and a relay publishes it afterwards. That gives at-least-once publishing, and consumers dedup by event ID.

Which leads to the framing I'd end on: end-to-end exactly-once delivery doesn't exist across arbitrary systems; what we actually build is at-least-once delivery plus idempotent (deduplicating) consumers, which yields exactly-once processing — the thing the business actually cares about.`,
      pitfalls: [
        "Saying 'just don't retry' — timeouts make outcomes ambiguous, so retries are unavoidable",
        "Idempotency key checked in Redis but not tied transactionally to the business write",
        "Writing DB and publishing to Kafka as two independent writes — no outbox",
        "Claiming a broker gives you exactly-once end-to-end, including side effects like emails"
      ],
      kotlin: `@Transactional
fun charge(key: String, req: ChargeRequest): ChargeResponse {
    // 1. claim the key atomically with the business write
    val claimed = jdbc.update(
        "INSERT INTO idempotency(key, endpoint) VALUES (?, 'charge') " +
        "ON CONFLICT DO NOTHING", key) == 1
    if (!claimed) {
        return loadStoredResponse(key)   // replay first outcome, do nothing
    }
    val result = paymentGateway.charge(req)
    orderRepo.markPaid(req.orderId, result.txId)
    storeResponse(key, result)           // same transaction
    return result
}`,
      complexity: "Anchor: exactly-once = at-least-once delivery + idempotent consumer (unique key in the same txn)"
    },
    {
      id: "jwt-vs-sessions",
      title: "JWT vs Server Sessions",
      difficulty: "Easy",
      url: "",
      pattern: "Concept",
      summary: "Would you use JWTs or server-side sessions for authentication in a web backend, and why?",
      hints: [
        "Probing: do you know the real trade-off — statelessness vs revocability — or do you just say 'JWT is modern'? Expect the follow-up: how do you log someone out with JWTs?",
        "Must include: session store lookup vs signature verification, revocation problem, short-lived access + refresh token pattern, cookie storage vs localStorage and XSS, when sessions are simply better."
      ],
      explanation: `The core trade-off is stateful-but-revocable versus stateless-but-hard-to-revoke. A server session is a random ID in an httpOnly cookie pointing at server-side state (Redis); every request costs a store lookup, but logout and revocation are trivial — delete the record. A JWT carries signed claims (user ID, roles, expiry), so any service verifies it with just the signing key, no lookup — but you cannot un-issue it: it's valid until it expires, no matter what.

That revocation gap is the question behind the question. The standard mitigation is short-lived access tokens (5–15 min) plus a long-lived refresh token stored server-side. Compromise or logout invalidates the refresh token, so exposure is bounded by the access token's remaining lifetime. Note what happened though: the refresh token store is state — so "JWTs are stateless" is only true for the hot path, and that's exactly the point: verification is stateless per-request, revocation is centralized and rare.

My actual recommendation: for a classic single-backend web app, plain sessions in Redis — simpler, instantly revocable, and a Redis GET is not your bottleneck. JWTs earn their complexity when many independent services must authenticate requests without a shared session hop — microservices behind a gateway, or third-party API access. Common shape: users log in and get a session or refresh token; the gateway exchanges it for a short-lived JWT that internal services verify locally.

Security details worth saying unprompted: tokens in httpOnly, Secure, SameSite cookies — not localStorage, which any XSS can read; validate the alg header (the alg=none and RS256-to-HS256 confusion attacks are classic); keep clocks in mind for exp; and never put sensitive data in the payload — it's base64, readable by anyone, only tamper-proof.`,
      pitfalls: [
        "No answer for 'how do you log out a JWT user' — the revocation problem is the whole question",
        "Storing JWTs in localStorage and shrugging off XSS",
        "Calling the refresh-token setup 'fully stateless' — the refresh store is state",
        "Recommending JWTs for a simple monolith where Redis sessions are strictly simpler"
      ],
      kotlin: `// Short-lived access JWT + server-side refresh token
fun issueTokens(userId: Long): TokenPair {
    val access = Jwts.builder()
        .subject(userId.toString())
        .claim("roles", rolesOf(userId))
        .expiration(Date(System.currentTimeMillis() + 10 * 60_000)) // 10 min
        .signWith(signingKey)
        .compact()
    val refresh = SecureRandom().let { r -> ByteArray(32).also(r::nextBytes) }
        .let(Base64.getUrlEncoder()::encodeToString)
    redis.set("refresh:" + refresh, userId.toString(), ttlDays = 30) // revocable
    return TokenPair(access, refresh)
}
// Logout = DEL refresh:{token}; access token dies within 10 minutes`,
      complexity: "Anchor: stateless verification vs revocability — short-lived access + revocable refresh bridges it"
    },
    {
      id: "monolith-vs-microservices",
      title: "Monolith vs Microservices",
      difficulty: "Medium",
      url: "",
      pattern: "Concept",
      summary: "Would you build a new product as a monolith or microservices, and when would you split?",
      hints: [
        "Probing: can you argue from real costs — distributed transactions, operational overhead, team topology — instead of reciting 'microservices scale better'?",
        "Must include: modular monolith as the default, what microservices actually buy (independent deploy/scale, team autonomy, fault isolation), what they cost (network failures, no cross-service transactions, observability), and organizational drivers (Conway's law)."
      ],
      explanation: `For a new product: a modular monolith, and I'd defend that opinion. One deployable, but with enforced internal module boundaries — separate packages per domain, modules talk through interfaces, no reaching into another module's tables. You keep in-process calls, one database with real ACID transactions across domains, one thing to deploy and debug — and you preserve the option to extract services later along the boundaries you already drew. Most early microservice adopters pay the distributed-systems tax before they have the traffic or team size to justify it.

What microservices actually buy: independent deployment (team A ships without waiting for team B's release train), independent scaling (scale the ingest service 10x without the admin panel), fault isolation, and per-service tech freedom. Notice these are mostly organizational benefits — the honest trigger for splitting is usually team count, not QPS. Conway's law is real: 5 engineers don't need 30 services; 200 engineers can't all commit to one deploy pipeline.

What they cost: every in-process call becomes a network call that can fail, so you now need timeouts, retries, circuit breakers, and service discovery. Cross-service transactions are gone — you get sagas and eventual consistency, and every workflow that used to be one @Transactional becomes a distributed design problem. Debugging needs distributed tracing; testing needs contract tests; and a shared-database "distributed monolith" — services coupled through one schema — is the worst of both worlds.

When I would split: a component with a clearly different scaling profile or availability requirement, a team that's blocked on the shared release cadence, or a bounded context that's genuinely independent (payments is the classic first extraction — compliance isolation plus a clean boundary). Split one service at a time, along existing module seams, with its own data store — not a big-bang decomposition.`,
      pitfalls: [
        "Opening with 'microservices because scalability' — a monolith behind a load balancer scales horizontally fine",
        "Ignoring the loss of cross-service ACID transactions (sagas, eventual consistency)",
        "Not mentioning team size / Conway's law as the real driver for splitting",
        "Proposing services that share one database — a distributed monolith"
      ],
      kotlin: `// Modular monolith: boundaries now, extraction option later
// build.gradle.kts modules: :billing  :catalog  :shipping  :app

// catalog exposes an interface; billing never touches catalog's tables
interface CatalogFacade {
    fun getPrice(sku: String): Money
}

// today: in-process call, shared txn possible
class BillingService(private val catalog: CatalogFacade) {
    fun invoiceLine(sku: String, qty: Int): Money =
        catalog.getPrice(sku).times(qty)
}
// tomorrow: swap CatalogFacade impl for an HTTP/gRPC client — callers unchanged`,
      complexity: "Anchor: split on team count and deploy contention, not QPS — modular monolith first"
    },
    {
      id: "cap-consistency",
      title: "CAP, Consistency Models & Replication",
      difficulty: "Hard",
      url: "",
      pattern: "Concept",
      summary: "Explain the CAP theorem and what consistency choices you actually make when replicating a database.",
      hints: [
        "Probing: do you understand CAP as a partition-time trade-off in real systems (leader vs quorum replication, replication lag), or only as a triangle diagram?",
        "Must include: partitions aren't optional so the real choice is C vs A during one, strong vs eventual vs read-your-writes consistency, sync vs async replication and lag, quorums (W+R>N), PACELC latency trade-off."
      ],
      explanation: `CAP says that when a network partition happens, a distributed system must choose between consistency (every read sees the latest write) and availability (every node keeps serving). The part people get wrong: partition tolerance isn't a choice — networks partition, period — so the real question is what you do during a partition: refuse some requests to stay correct (CP) or keep serving possibly-stale data (AP). And PACELC adds the more practically important half: even with no partition, you're trading latency against consistency on every single write, because stronger consistency means waiting for more replicas.

Concretely, with leader-based replication (the Postgres/MySQL default): synchronous replication means commits wait for a replica — consistent but slower and stalls if the replica dies; asynchronous means commits return immediately — fast, but replicas lag, and a failover can lose acknowledged writes. Replication lag is where theory bites: a user updates their profile, the next page load reads a lagging replica, and their change has "disappeared". That's why intermediate models matter — read-your-writes (route a user's reads to the leader briefly after their write, or pin by session) and monotonic reads (a user never sees time go backwards) fix the visible symptoms without paying for global strong consistency.

Quorum systems (Cassandra, Dynamo-style) make the dial explicit: N replicas, write to W, read from R; if W+R > N the read set intersects the write set and you get strong consistency; W=1, R=1 is fast, available, and eventually consistent. Same trade-off, tunable per query.

How I'd answer "what would you choose": per domain, not per system. Payments and inventory decrements: CP — I'd rather return an error than double-spend. Product views, likes, feeds: AP with eventual consistency — stale by a second is invisible and availability is revenue. And in the common single-region Postgres world, the CAP conversation mostly cashes out as: async replicas for read scaling, leader reads where read-your-writes matters, and knowing exactly which writes you'd lose in a failover.`,
      pitfalls: [
        "Presenting CAP as 'pick any 2 of 3' — partition tolerance is not optional",
        "No mention of replication lag or read-your-writes — the everyday consequence",
        "Not knowing the W+R>N quorum condition when claiming Cassandra knowledge",
        "Giving one global answer instead of choosing per domain (payments CP, feeds AP)"
      ],
      kotlin: `// Read-your-writes over async replicas: pin the writer to the leader briefly
class RoutingDataSource(
    private val leader: DataSource,
    private val replicas: List<DataSource>
) {
    private val recentWriters = ConcurrentHashMap<Long, Long>() // userId -> ts

    fun markWrite(userId: Long) { recentWriters[userId] = System.nanoTime() }

    fun forRead(userId: Long): DataSource {
        val ts = recentWriters[userId]
        val recentlyWrote = ts != null && System.nanoTime() - ts < 2_000_000_000
        return if (recentlyWrote) leader else replicas.random()
    }
}
// Quorum framing: N=3, W=2, R=2 -> W+R>N -> reads see latest write`,
      complexity: "Anchor: partitions happen — choose C vs A per domain; W+R>N is the quorum consistency line"
    }
  ]
});
