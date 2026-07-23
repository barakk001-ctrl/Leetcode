window.LC_LEARN = window.LC_LEARN || {};
window.LC_LEARN[8] = {
  sections: [
    {
      title: "DP Is Just Recursion Plus Caching",
      body: `Strip away the mystique: dynamic programming is a recursive solution where you cache answers to subproblems so you never compute the same one twice. Two properties must hold for this to work. First, overlapping subproblems — the naive recursion hits the same inputs over and over. Second, optimal substructure — the best answer to the big problem is built from best answers to smaller ones. If either is missing, DP does not apply.\n\nClimbing Stairs is the canonical first example, and it is Fibonacci in disguise. To reach step n you either took one step from n-1 or two steps from n-2, so ways(n) = ways(n-1) + ways(n-2). Naive recursion recomputes ways(k) exponentially many times — O(2^n) calls. Add a cache and each distinct input is computed exactly once, collapsing the tree to O(n) work. That collapse is the whole trick: DP complexity = (number of distinct states) x (work per state).\n\nAs a backend dev you already know this move — it is memoizing an expensive pure function. The interview skill is spotting which parameters define the state, because the cache key IS the state.`,
      kotlin: `// Naive: O(2^n)
fun climbNaive(n: Int): Int =
    if (n <= 2) n else climbNaive(n - 1) + climbNaive(n - 2)

// Memoized: O(n) — same recursion, plus a cache
fun climb(n: Int, memo: IntArray = IntArray(n + 1)): Int {
    if (n <= 2) return n
    if (memo[n] != 0) return memo[n]
    memo[n] = climb(n - 1, memo) + climb(n - 2, memo)
    return memo[n]
}`
    },
    {
      title: "The 4-Step Recipe",
      body: `Every DP problem yields to the same four steps. (a) Define the state in words: a full English sentence like "dp[i] = the minimum cost to reach step i" or "dp[i][j] = length of the LCS of the first i chars of A and first j chars of B". (b) Write the recurrence: how does dp[i] combine answers to smaller states? This is where the problem's decision structure lives. (c) Base cases: the smallest states you can answer without recursion — usually dp[0], sometimes an empty prefix. (d) Iteration order and answer location: fill states so that everything a state depends on is already computed, and know whether the answer is dp[n], max over all dp[i], or something else.\n\nStep (a) is where interviews are won or lost. If you can say the state definition out loud as a precise sentence, the recurrence, base cases, and loops almost write themselves — each line of code is just the sentence restated. If you cannot say it, no amount of coding will save you. When stuck, iterate on the sentence: add a dimension ("...ending exactly at i", "...using only the first i coins"), or shrink the meaning until the recurrence becomes expressible.\n\nCommon pitfall: a state definition that is too loose. "dp[i] = longest increasing subsequence in the first i elements" has no clean recurrence, but "dp[i] = longest increasing subsequence ENDING at index i" does. The word "ending" is doing all the work.`
    },
    {
      title: "Top-Down vs Bottom-Up, and O(1) Space",
      body: `Memoization (top-down) keeps the recursive shape: write the brute-force recursion, add a cache, done. Tabulation (bottom-up) inverts it: allocate a dp array and fill it iteratively from the base cases. Both visit the same states and have identical big-O complexity. Top-down is easier when the recurrence is natural but the reachable states are sparse or the iteration order is awkward (interval DP, tricky multi-dimensional states) — it only computes states actually needed. Bottom-up avoids recursion depth limits, is a constant factor faster, and is the required form for the classic space optimization.\n\nThat optimization: when dp[i] depends only on the last k previous states, you do not need the whole array — keep k rolling variables. House Robber is the textbook case: dp[i] = max(dp[i-1], dp[i-2] + nums[i]) depends only on the previous two values, so O(n) space drops to O(1). Same trick works for Climbing Stairs, Fibonacci, and row-by-row 2D DPs (keep two rows instead of the full table).\n\nInterview strategy: derive the recurrence top-down in your head, code bottom-up, then mention the rolling-variable optimization — it is an easy, expected follow-up.`,
      kotlin: `// House Robber: dp[i] = max(dp[i-1], dp[i-2] + nums[i])
fun rob(nums: IntArray): Int {
    var prev2 = 0  // best up to i-2
    var prev1 = 0  // best up to i-1
    for (x in nums) {
        val cur = maxOf(prev1, prev2 + x)
        prev2 = prev1
        prev1 = cur
    }
    return prev1
}`
    },
    {
      title: "The Classic Shapes",
      body: `Decision at each item: at every element, take it or skip it, and taking constrains the future. House Robber — rob house i (adds nums[i], forbids i-1) or skip it. The recurrence encodes exactly that choice: dp[i] = max(dp[i-1], dp[i-2] + nums[i]).\n\nUnbounded choices: Coin Change asks the fewest coins to make an amount, coins reusable. State: dp[a] = min coins to make amount a. The last coin used must be one of the denominations, so try each: dp[a] = min over coins c of dp[a - c] + 1. You are saying "if the last coin was c, the rest of the amount was made optimally" — optimal substructure in its purest form. O(amount x coins).\n\nSubsequence DP: LIS with dp[i] = length of the longest increasing subsequence ending at i; dp[i] = 1 + max(dp[j]) over j < i with nums[j] < nums[i], answer = max over all i, O(n^2). Two-string DP: LCS builds a 2D table where dp[i][j] covers prefixes of each string — if the chars match, dp[i][j] = dp[i-1][j-1] + 1; else max(dp[i-1][j], dp[i][j-1]). Nearly every edit-distance-style problem is this table with a different cell rule. Partition DP: Word Break — dp[i] = true if the first i chars can be segmented; dp[i] = OR over splits j of (dp[j] AND s[j..i) in dict). "Can this be cut into valid pieces" is always this shape.`,
      kotlin: `// Coin Change: min coins to reach amount
fun coinChange(coins: IntArray, amount: Int): Int {
    val dp = IntArray(amount + 1) { amount + 1 }  // "infinity"
    dp[0] = 0
    for (a in 1..amount) {
        for (c in coins) {
            if (c <= a) dp[a] = minOf(dp[a], dp[a - c] + 1)
        }
    }
    return if (dp[amount] > amount) -1 else dp[amount]
}`
    },
    {
      title: "Recognition Cheat-Sheet: DP vs Greedy",
      body: `Phrases that scream DP: "number of ways to..." (count paths, decodings, combinations), "minimum/maximum cost to reach..." (min path sum, coin change), "longest subsequence with property X" (LIS, LCS), "can it be partitioned/segmented" (Word Break, Partition Equal Subset Sum). Structural tells: you make a sequence of choices, each choice affects what is legal later, and brute force would be exponential. If the answer for the whole depends on answers for prefixes, suffixes, or intervals of the input — DP.\n\nGreedy vs DP is the classic fork. Greedy works when the locally best choice is provably safe — you can argue an exchange: any optimal solution can be rewritten to start with the greedy choice without getting worse. Interval scheduling (pick the meeting that ends earliest) and Jump Game are greedy for exactly that reason. When choices interact — taking item i changes the value of taking item j in a way no single sort order captures (House Robber, Coin Change with arbitrary denominations, 0/1 Knapsack) — greedy breaks and you need DP to explore both branches with caching.\n\nQuick test in an interview: try to construct a counterexample to the obvious greedy in 30 seconds. Coin Change with coins [1, 3, 4] and amount 6: greedy-largest gives 4+1+1 = 3 coins, optimal is 3+3 = 2. Found one? DP. Cannot find one and can sketch the exchange argument? Greedy. Say this reasoning out loud — the recognition step is worth as much as the code.`
    }
  ]
};
