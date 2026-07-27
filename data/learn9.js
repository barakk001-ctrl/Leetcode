window.LC_LEARN = window.LC_LEARN || {};
window.LC_LEARN[9] = {
  sections: [
    {
      title: "How to Run a System-Design Answer",
      body: `A system-design interview is a 40-minute conversation, and the biggest failure mode is not wrong answers — it is rambling. Run a script: (1) requirements and scale numbers, (2) API sketch, (3) data model, (4) deep-dive one component, (5) trade-offs. Spend the first five minutes nailing down numbers out loud: how many users, reads vs writes ratio, data size per record. 10M daily users doing 10 requests each is ~100M requests/day, which is only ~1,200 req/s average — maybe 5,000 req/s at peak. Saying that out loud instantly signals seniority, because most candidates never quantify anything.\n\nInterviewers grade structure and trade-off reasoning, not the "right" architecture. There is no right architecture — a design that names its weaknesses ("this shard key hot-spots on celebrity users, here is what I'd do about it") beats a fancier design presented as flawless. When you make a choice, name the alternative you rejected and why.\n\nNumbers worth memorizing: a single modern server handles ~1,000-10,000 simple requests/s; a LAN round-trip is ~0.5-1ms; an SSD random read ~0.1ms, spinning-disk seek ~10ms; a same-region datacenter hop ~1ms; cross-region (US-EU) ~80-100ms round-trip; reading 1MB sequentially from memory ~10 microseconds, from SSD ~1ms. These let you sanity-check any design in your head: if a request fans out to 5 services cross-region, you have already spent half a second doing nothing.`
    },
    {
      title: "Scaling Basics: Stateless First",
      body: `Vertical scaling (a bigger box) is underrated: it is simple, has zero coordination cost, and a modern cloud instance with 128 cores and 1TB RAM goes remarkably far. Horizontal scaling (more boxes) is what you reach for when one box is not enough or when you need redundancy — and redundancy is usually the real reason, since a single machine is a single point of failure no matter how big it is.\n\nHorizontal scaling only works cleanly when services are stateless: any instance can serve any request, so a load balancer can round-robin freely, instances can die and be replaced, and autoscaling is trivial. What breaks this is state: in-memory sessions, locally stored uploads, in-process counters and caches. The whole game of scaling is pushing state out of the service and into things built to hold it — sessions to Redis, files to object storage (S3), counters to the database or Redis.\n\nSticky sessions (the load balancer pins a user to one instance) are the tempting shortcut, and interviewers like probing why they are bad: an instance crash logs out every user pinned to it, load skews unevenly, and deploys get painful. The standard answer: externalize session state to Redis with a TTL, or go fully stateless with signed tokens (JWT) so the session lives in the request itself.`,
      kotlin: `// Stateless service: session lives in Redis, not in the JVM
fun handleRequest(sessionId: String): UserContext {
    val json = redis.get("session:" + sessionId)
        ?: throw UnauthorizedException()
    redis.expire("session:" + sessionId, 30.minutes) // sliding TTL
    return objectMapper.readValue(json, UserContext::class.java)
}
// Any instance can serve this request; instances can die freely.`
    },
    {
      title: "Databases Under Load",
      body: `The first move when a database is read-heavy is read replicas: the primary handles writes, replicas serve reads, and you scale reads almost linearly. The catch is replication lag — usually milliseconds, but under load it can be seconds. A user who updates their profile and immediately reads it from a replica sees stale data. Standard fixes: read your own writes from the primary for a short window after a write, or route by freshness requirement (analytics can be stale, "my account page" cannot).\n\nSharding splits data across databases when writes or total size outgrow one machine. The shard key decision is the whole interview: shard by user_id and all of one user's data is co-located (great for per-user queries, cross-user queries now hit every shard); shard by something skewed and you get hot partitions — one celebrity account melting one shard while the others idle. Mitigations: hash the key for even spread, or add a random suffix to hot keys. Resharding live data is genuinely painful, which is why consistent hashing and directory-based schemes exist.\n\nThe honest senior answer: a single well-tuned Postgres with good indexes and a connection pool handles thousands of transactions per second and terabytes of data. Most companies never outgrow it. Also know the unglamorous bottleneck: connection pools. Postgres connections are expensive (a process each), so apps use a pool (HikariCP) of maybe 10-50 connections per instance — 100 instances times 50 connections will crush the database, which is why PgBouncer sits in front at scale.`,
      kotlin: `-- Replication lag in one picture:
-- t=0   UPDATE users SET name='Bo' WHERE id=7;  -- on primary
-- t=5ms SELECT name FROM users WHERE id=7;      -- on replica -> old name!

-- Shard routing by user_id (application side):
-- shard = hash(user_id) % num_shards
-- Good: all of user 7's orders on one shard.
-- Bad:  "top orders across all users" now queries every shard.`
    },
    {
      title: "Caching",
      body: `Three write policies, know them by name. Cache-aside (lazy): the app reads the cache, on miss loads from the DB and populates the cache; writes go to the DB and invalidate the cache. It is the default because it is simple and the cache being down just means slower, not broken. Write-through: writes go through the cache to the DB synchronously — reads after writes are always fresh, but every write pays double. Write-behind: writes hit the cache and flush to the DB asynchronously — fastest writes, but you can lose data if the cache dies before flushing, so it is rare outside counters and metrics.\n\nThe two hard problems: invalidation and stampede. Invalidation — knowing when cached data is wrong — is why everything gets a TTL as a safety net; you will invalidate imperfectly, so bound the staleness (60s TTL means at most 60s wrong). Stampede (thundering herd): a hot key expires and 10,000 concurrent requests all miss and hit the DB simultaneously. Fixes: per-key locking so one request rebuilds while others wait or serve stale, probabilistic early refresh, or jittered TTLs so keys do not expire in unison.\n\nCaching is a hierarchy, and naming the layers scores points: browser cache and CDN for static assets and public GET responses (Cache-Control headers), app-level Redis/Memcached for hot objects and query results (~0.5ms vs ~5ms for a DB hit), and the DB's own buffer pool which already caches hot pages in RAM — one reason a "slow" query is sometimes fast the second time.`,
      kotlin: `fun getUser(id: Long): User {
    val key = "user:" + id
    redis.get(key)?.let { return objectMapper.readValue(it) } // hit
    val user = userRepository.findById(id)                    // miss -> DB
    val ttl = 300 + Random.nextLong(60)                       // jitter
    redis.setex(key, ttl, objectMapper.writeValueAsString(user))
    return user
}

fun updateUser(user: User) {
    userRepository.save(user)
    redis.del("user:" + user.id) // invalidate, don't update-in-place
}`
    },
    {
      title: "Async and Queues",
      body: `You put a queue between services for three reasons. Spikes: a flash sale produces 50,000 orders/s for two minutes; the queue absorbs the burst and consumers drain it at their sustainable 5,000/s. Decoupling: the checkout service should not know or care that email, analytics, and inventory all react to an order — it publishes one event and forgets. Retries: if the email service is down for an hour, messages wait in the queue instead of failing; the producer is not blocked and nothing is lost.\n\nThe rule interviewers always probe: real queues are at-least-once, not exactly-once. A consumer can process a message and crash before acknowledging it — the message is redelivered and processed twice. Therefore consumers MUST be idempotent: processing the same message twice must equal processing it once. Techniques: a unique message/idempotency key checked against a processed-set before acting, upserts instead of inserts, or naturally idempotent operations (set balance to X, not add 10 to balance). Poison messages that fail repeatedly go to a dead-letter queue after N attempts, so one bad payload does not block the partition — and someone should actually monitor the DLQ.\n\nKafka vs RabbitMQ honestly: Kafka is a replicated log — messages persist for days, consumers track their own offsets and can replay history, partitions give ordering per key, and it does millions of messages/s; it shines for event streams and fan-out to many consumer groups. RabbitMQ is a classic broker — smart routing, per-message acks, low latency, simpler to operate; it shines for task queues and RPC-ish work distribution. Saying "Kafka" for a background-job queue is over-engineering; saying so is a good look.`,
      kotlin: `// Idempotent consumer: at-least-once delivery is survivable
fun onPaymentEvent(event: PaymentEvent) {
    // INSERT ... ON CONFLICT DO NOTHING on the event id
    val fresh = processedEvents.tryInsert(event.eventId)
    if (!fresh) return            // duplicate delivery -> no-op
    accountService.credit(event.accountId, event.amount)
    // crash between tryInsert and credit? -> wrap both in one DB tx
}`
    },
    {
      title: "API and Service Design",
      body: `REST modeling is about resources, not verbs: POST /orders creates, GET /orders/42 reads, GET /users/7/orders lists — the URL names a thing, the HTTP method is the action. Two details interviewers poke at: pagination and versioning. Offset pagination (LIMIT 20 OFFSET 10000) gets slow on deep pages and skips/duplicates rows when data changes mid-scroll; cursor pagination (WHERE id > last_seen_id LIMIT 20) is stable and O(1) per page — the standard answer for feeds. Versioning: /v1/ in the path is crude but explicit; the deeper point is to make additive, backward-compatible changes (new optional fields) so you rarely need v2 at all.\n\nSynchronous call chains are the default and the trap. If A calls B calls C calls D, latencies add, availabilities multiply (four 99.9% services chained are ~99.6% together), and a slow D stalls everything upstream. Events invert this: A publishes "order created" and moves on; B, C, D consume independently. The cost is eventual consistency and harder debugging — a fair trade for non-critical downstream work (email, analytics), a bad one when the caller needs the result now.\n\nThe reliability trio — every backend interview touches it. Timeouts: every remote call gets one, always, because a call with no timeout can hang a thread forever and cascade into total thread-pool exhaustion. Retries: only on transient failures (timeouts, 503s — never on 400s), with exponential backoff plus jitter, because synchronized retries from a thousand clients are a self-inflicted DDoS on a service that was trying to recover. Circuit breakers: after N consecutive failures, stop calling the sick service and fail fast for a cooldown, then probe with a trial request (half-open). Together: timeout bounds one call, retry survives a blip, breaker stops you from hammering a downed dependency.`,
      kotlin: `// Retry with exponential backoff + jitter (the pattern, in Kotlin)
suspend fun <T> withRetry(maxAttempts: Int = 3, block: suspend () -> T): T {
    var attempt = 0
    while (true) {
        try {
            return withTimeout(2_000) { block() }   // timeout: always
        } catch (e: TransientException) {
            if (++attempt >= maxAttempts) throw e
            val base = 100L * (1L shl attempt)      // 200, 400, 800ms
            delay(base + Random.nextLong(base))     // jitter: avoid sync'd herds
        }
    }
}`
    },
    {
      title: "Consistency: CAP, Eventual, Sagas",
      body: `CAP in practice: network partitions happen whether you like it or not, so the real choice is what your system does during one. A CP system (e.g. a strongly consistent store like etcd or a single-primary DB) refuses writes it cannot safely commit — you get errors but never stale data. An AP system (e.g. Dynamo-style stores) keeps accepting writes on both sides of the partition and reconciles later — always available, sometimes stale or conflicting. Neither is "better"; a bank ledger wants CP, a shopping cart or like-counter wants AP. Say it as behavior, not letters, and you sound like you have operated one.\n\nEventual consistency has a UX face: read-your-writes. A user who posts a comment and refreshes must see their own comment, even if strangers seeing it 2 seconds later is fine. Implementations: route that user's reads to the primary briefly after a write, session-pin reads, or version tokens the client sends back. Monotonic reads (never see data go backwards in time) is the sibling guarantee worth naming.\n\nAcross services there are no ACID transactions — you cannot wrap an order-service write and a payment-service charge in one commit. Two-phase commit exists but blocks and scales poorly, so the practical answer is the saga: a sequence of local transactions, each with a compensating action for rollback. Order created -> payment charged -> inventory reserved; if inventory fails, run the compensations in reverse: refund payment, cancel order. Sagas are eventually consistent and expose intermediate states, so design them to be visible (order status: PENDING_PAYMENT) rather than pretending atomicity.`,
      kotlin: `// Saga: local transactions + compensations, not one big commit
suspend fun placeOrder(cmd: OrderCommand) {
    val order = orderService.create(cmd)              // tx 1
    try {
        paymentService.charge(order)                  // tx 2
        inventoryService.reserve(order)               // tx 3
    } catch (e: Exception) {
        paymentService.refund(order)                  // compensate tx 2
        orderService.cancel(order)                    // compensate tx 1
        throw e
    }
}`
    },
    {
      title: "Observability and 3am Operations",
      body: `Three pillars, three different questions. Logs answer "what happened to this one request" — structured (JSON), with a correlation/trace ID stamped on every line so you can follow request 7f3a across five services. Metrics answer "how is the system doing overall" — counters and latency histograms, cheap to store, and the thing you alert on: p99 latency, error rate, queue depth. Always say p99, not average — an average of 50ms can hide 5% of users waiting 3 seconds. Traces answer "where did this request spend its time" — a waterfall of spans across services, the tool that turns "checkout is slow" into "the inventory call inside checkout is slow".\n\nOperational muscles interviewers listen for: health checks split into liveness (is the process alive — restart it if not) and readiness (can it serve traffic — pull it from the load balancer if not; the difference matters during startup and when a dependency is down). Graceful degradation: when recommendations are down, show best-sellers, not an error page — decide in advance which features are load-bearing. Feature flags: decouple deploy from release, roll out to 1% first, and — the killer argument — turn a broken feature off in seconds instead of rolling back a deploy under pressure.\n\n"You get paged at 3am, checkout error rate is spiking — walk me through it" is a favorite senior question because it reveals whether you have actually operated software. A good shape: check the dashboards (error rate, p99, saturation) to scope it — one endpoint or everything? one region? Then correlate with change: did a deploy, flag flip, or config change land recently? (It is almost always a change.) Check dependency health — DB connections, queue depth, downstream error rates. Mitigate first, diagnose second: roll back, flip the flag, shed load. Root-cause analysis is for the morning; at 3am you stop the bleeding.`,
      kotlin: `// Structured log line with correlation id — grep-able across services
logger.info(
    "checkout_failed",
    kv("traceId", ctx.traceId),
    kv("orderId", order.id),
    kv("step", "payment"),
    kv("latencyMs", elapsed)
)
// Alert on symptoms users feel (p99, error rate),
// not on causes (CPU 80%) — high CPU with happy users is fine.`
    }
  ]
};
